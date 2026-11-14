import './style.css';
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import HomeScene from './scenes/HomeScene.js';
import WorldScene from './scenes/WorldScene.js';
import { state, update, correct, addFace, restore, onChange, faceSummary } from './brain/state.js';
import { checkSafety } from './brain/safety.js';
import { pickLine } from './brain/dialogue.js';
import { startDirector, notNow, setQuiet, noteInteraction, directorStatus } from './brain/director.js';
import { quickValence } from './brain/words.js';
import { showBubble, hideBubble, bubbleOpen, catThinking, setLoader, toast, openPanel, panelOpen, closePanel, setSenses, el } from './ui/hud.js';
import { showHelp, helpOpen } from './ui/help.js';
import { startOnboarding } from './ui/onboarding.js';
import { startFace } from './sensing/face.js';
import { initMic, startRecording, stopRecording, isRecording } from './sensing/mic.js';
import { load, save } from './storage.js';

const $ = (id) => document.getElementById(id);
export let saved = load();

// ------------------------------------------------------------------ game
export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#FFF6E9',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 720, height: 1280 },
  scene: [BootScene, HomeScene, WorldScene],
});
game.registry.set('look', { coat: saved.settings.coat, acc: saved.settings.acc });

export const home = () => game.scene.getScene('Home');
export const world = () => game.scene.getScene('World');
let view = 'Home';
export function showScene(name) {
  $('homeBtn').classList.toggle('on', name === 'Home');
  $('mapBtn').classList.toggle('on', name === 'World');
  if (view === name) return;
  game.scene.sleep(view); game.scene.wake(name); view = name;
}
export const currentScene = () => view;

// ------------------------------------------------------------------ AI worker (Whisper + sentiment)
const ai = new Worker(new URL('./sensing/aiWorker.js', import.meta.url), { type: 'module' });
let aiReady = false, sentimentReady = false, aiFailed = false, reqId = 0;
const pending = new Map();
ai.onmessage = ({ data }) => {
  if (data.type === 'progress' && !aiReady) setLoader(`${saved.name} is waking up… ${data.pct}%`);
  if (data.type === 'sentiment-ready') sentimentReady = true;
  if (data.type === 'ready') { aiReady = true; setLoader(null); }
  if (data.type === 'result') { pending.get(data.id)?.resolve(data); pending.delete(data.id); }
  if (data.type === 'error') {
    if (data.id && pending.has(data.id)) { pending.get(data.id).reject(new Error(data.message)); pending.delete(data.id); }
    else { aiFailed = true; setLoader(null); toast('I couldn\'t load my listening ears (offline?). You can type to me ⌨️', 4000); }
  }
};
function askAI(msg, transfer) {
  const id = ++reqId;
  return new Promise((resolve, reject) => { pending.set(id, { resolve, reject }); ai.postMessage({ ...msg, id }, transfer || []); });
}
export const aiStatus = () => ({ aiReady, sentimentReady, aiFailed });

// ------------------------------------------------------------------ speaking
export function say(line, opts = {}) {
  if (!line) return;
  showBubble(line, { catName: saved.name, onChoice: runEffect, ...opts });
  if (line.speaker === 'cat' && view === 'Home') home()?.play(line.anim);
  game.events.emit('said', line);
}
const sayCtx = (ctx, opts) => say(pickLine(ctx, state), opts);

let lastSaved = 0;
function remember() {
  if (Date.now() - lastSaved < 5000) return;
  lastSaved = Date.now();
  save({ last: { energy: state.energy, mood: state.mood } });
}
let shownEnergy = null;
onChange((s) => {
  if (s.energy !== shownEnergy) { shownEnergy = s.energy; home()?.setEnergy(s.energy); }
  remember();
});

// ------------------------------------------------------------------ the talk loop (guide, step 10)
/**
 * Every piece of text — spoken or typed — goes through here.
 * The safety check ALWAYS runs first, before anything else happens with the text.
 */
export async function hear(text, { valence = null, loudness = null, getValence = null } = {}) {
  text = (text || '').trim();
  if (!text) return sayCtx('missed');
  const risk = checkSafety(text);                       // ALWAYS FIRST
  if (risk >= 2) { hideBubble(); return openHelp(risk); }
  if (valence == null && getValence) valence = await getValence();
  if (valence == null) valence = quickValence(text);
  update({ text, valence, loudness });
  remember();
  const line = pickLine(risk === 1 ? 'gentle_check' : 'reply', state);
  say(line, { quote: text, chip: risk === 1, onChip: () => openHelp(1) });
  noteInteraction();
}

const talk = $('talkBtn');
let pressAt = 0, pointerDown = false;
const TALK_LABEL = '🎙️ Talk';

talk.addEventListener('pointerdown', async (e) => {
  e.preventDefault();
  pointerDown = true;
  if (isRecording()) return finishTalk();               // tap-to-send (toggle mode)
  if (!saved.settings.mic) return openTypeBox('Your microphone is off — type to me instead.');
  if (aiFailed) return openTypeBox('My listening ears didn\'t load, but I can read!');
  if (!aiReady) { sayCtx('waking'); return; }
  try { await initMic(); setSenses({ mic: 'on' }); } catch {
    setSenses({ mic: 'off' });
    return openTypeBox('I can\'t use the microphone — that\'s okay, type to me instead.');
  }
  hideBubble();
  startRecording();
  pressAt = Date.now();
  talk.classList.add('rec'); talk.textContent = '👂 Listening…';
  home()?.setPose('listen');
  game.events.emit('listening', true);
  if (!pointerDown) talk.textContent = '✔️ Tap to send';  // released during the permission prompt
});
talk.addEventListener('pointerup', () => {
  pointerDown = false;
  if (!isRecording()) return;
  if (Date.now() - pressAt < 350) { talk.textContent = '✔️ Tap to send'; return; }   // quick tap → toggle mode
  finishTalk();
});
talk.addEventListener('contextmenu', (e) => e.preventDefault());

async function finishTalk() {
  talk.classList.remove('rec'); talk.textContent = TALK_LABEL;
  game.events.emit('listening', false);
  catThinking(true);                                    // instant reaction (< 0.3 s)
  let rec = null;
  try { rec = await stopRecording(); } catch { rec = null; }
  if (!rec || rec.seconds < 0.4) { catThinking(false); home()?.setPose(null); return sayCtx('missed'); }
  const { audio, loudness } = rec;
  try {
    const res = await askAI({ type: 'transcribe', audio }, [audio.buffer]);   // the buffer is moved, then discarded
    catThinking(false); home()?.setPose(null);
    hear(res.text, { valence: res.valence, loudness });
  } catch {
    catThinking(false); home()?.setPose(null); sayCtx('missed');
  }
}

/** ⌨️ type instead (for users without a mic, or in public). onText overrides where the text goes. */
export function openTypeBox(hint, onText) {
  const input = el('input', { type: 'text', maxlength: 400, placeholder: 'Type to ' + saved.name + '…', 'aria-label': 'Message' });
  const send = () => {
    const text = input.value.trim(); if (!text) return;
    panel.close();
    if (onText) return onText(text);
    hear(text, { getValence: sentimentReady ? async () => { try { return (await askAI({ type: 'sentiment', text })).valence; } catch { return null; } } : null });
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  const panel = openPanel({
    title: '⌨️ Type to ' + saved.name,
    body: el('div', {}, hint ? el('p', { class: 'small' }, hint) : null,
      el('div', { class: 'row' }, input, el('button', { class: 'btn primary', onclick: send }, 'Send')),
      el('p', { class: 'small' }, 'What you write is read on this phone and then forgotten.')),
  });
}

// ------------------------------------------------------------------ help (safety rules)
export function openHelp(level) {
  setQuiet(true);
  closePanel();
  showHelp(level, {
    catName: saved.name,
    dim: (on) => { home()?.dim(on); world()?.dim(on); },
    onStay: stayWithMe,
    onClose: () => setQuiet(false),
  });
}

/** "Stay with me": the cat comes close and keeps you company for a few minutes. */
let stayTimer = 0;
function stayWithMe() {
  setQuiet(true);
  showScene('Home');
  home()?.setPose('happy');
  let n = 0;
  const next = () => {
    say(pickLine('stay', state), { chip: true, onChip: () => openHelp(2), sticky: true });
    if (++n < 5) stayTimer = setTimeout(next, 25000);
    else { home()?.setPose(null); setQuiet(false); }
  };
  clearTimeout(stayTimer);
  next();
}

// ------------------------------------------------------------------ tap choices → effects
export const effects = {
  confirm: () => { correct({ energy: state.energy, mood: state.mood }); sayCtx('thanks'); },
  notnow: () => { notNow(); sayCtx('notnow'); },
  ok: () => {},
  talk: () => { toast('Hold 🎙️ Talk (or tap it) and tell me ⌨️ works too'); talk.classList.add('rec'); setTimeout(() => !isRecording() && talk.classList.remove('rec'), 1200); },
  stay: () => stayWithMe(),
  turtle: () => { showScene('World'); world().visitNpc('turtle'); },
  reassure: () => sayCtx('reassure'),
};
export function registerEffect(name, fn) { effects[name] = fn; }

export function lead(place) {
  if (place === 'home') { showScene('Home'); return say(pickLine('arrive', state, 'cat', 'home')); }
  showScene('World');
  world().leadTo(place);
}

export function runEffect(effect, line) {
  const fields = {};
  let handled = false;
  for (const part of String(effect).split('+')) {
    const [k, v] = part.split(':');
    if (k === 'mood') fields.mood = v;
    else if (k === 'energy') fields.energy = Number(v);
    else if (k === 'need') fields.need = v;
    else if (k === 'go') { lead(v); handled = true; }
    else if (k === 'help') { openHelp(Number(v)); handled = true; }
    else if (effects[k]) { effects[k](line); handled = true; }
  }
  if (Object.keys(fields).length) {
    correct(fields);              // the user's answer is the truth
    remember();
    if (!handled) sayCtx('thanks');
  }
}

game.events.on('arrived', (place) => say(pickLine('arrive', state, 'cat', place)));
game.events.on('npc', (who) => say(pickLine(who, state, who)));
game.events.on('catTapped', () => { if (!bubbleOpen()) sayCtx('pet'); });

// ------------------------------------------------------------------ camera (face = hint)
let stopFace = null, faceTimer = 0;
export async function startCamera() {
  if (!saved.settings.camera || stopFace) return;
  try {
    stopFace = await startFace($('cam'), addFace);
    setSenses({ cam: 'on' });
    clearInterval(faceTimer);
    faceTimer = setInterval(() => update(), 3000);      // fold the last 10 s of face hints into the state
  } catch {
    stopFace = null; setSenses({ cam: 'off' });
    toast('Camera is off — I\'ll go by your words instead.', 3500);
  }
}
export function stopCamera() {
  clearInterval(faceTimer);
  if (stopFace) { stopFace(); stopFace = null; }
}

// ------------------------------------------------------------------ HUD buttons
$('homeBtn').addEventListener('click', () => showScene('Home'));
$('mapBtn').addEventListener('click', () => showScene('World'));
$('typeBtn').addEventListener('click', () => openTypeBox());
$('tasksBtn').addEventListener('click', () => (effects.tasks ? effects.tasks() : toast('Tasks are coming soon 🧶')));
$('helpBtn').addEventListener('click', () => openHelp(0));

// Hidden debug panel: triple-tap the cat's name (sliders for energy/mood, live face numbers).
let taps = [];
$('catName').addEventListener('click', () => {
  taps = taps.filter((t) => Date.now() - t < 700).concat(Date.now());
  if (taps.length >= 3) { taps = []; openDebug(); }
});
function openDebug() {
  const moods = ['heavy', 'low', 'neutral', 'light', 'bright'];
  const energy = el('input', { type: 'range', min: 1, max: 5, step: 1, value: state.energy });
  const mood = el('input', { type: 'range', min: 0, max: 4, step: 1, value: moods.indexOf(state.mood) });
  const out = el('pre');
  const apply = () => correct({ energy: Number(energy.value), mood: moods[Number(mood.value)] });
  energy.addEventListener('input', apply); mood.addEventListener('input', apply);
  const tick = setInterval(() => {
    const f = faceSummary();
    out.textContent = JSON.stringify({ state, face: f && Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Math.round(v * 100) / 100])), director: directorStatus(), ai: aiStatus() }, null, 1);
  }, 300);
  openPanel({
    title: '🔧 Debug', className: 'debug', onClose: () => clearInterval(tick),
    body: el('div', {},
      el('label', {}, 'Energy (1–5)', energy), el('label', {}, 'Mood (heavy … bright)', mood), out,
      el('button', { class: 'btn', onclick: () => { closePanel(); clearInterval(tick); sayCtx('greeting'); } }, 'Greet now')),
  });
}

// ------------------------------------------------------------------ start
export function begin() {
  $('catName').textContent = saved.name;
  restore(saved.last);
  home()?.setEnergy(state.energy);
  ai.postMessage({ type: 'load' });
  setLoader(`${saved.name} is waking up…`);
  startCamera();
  if (!saved.settings.mic) setSenses({ mic: 'off' });
  startDirector((line) => say(line), () => bubbleOpen() || panelOpen() || helpOpen() || isRecording());
  game.events.emit('begin');
}

game.events.once('homeReady', () => {
  showScene('Home');
  if (!saved.onboarded) {
    startOnboarding(({ name, camera, mic }) => {
      save({ name, onboarded: true, settings: { ...saved.settings, camera, mic } });
      saved = load();
      begin();
    });
  } else begin();
});

export function reloadSaved() { saved = load(); return saved; }
if (import.meta.env.DEV) window.mochi = { game, state, hear, say, openHelp, effects, aiStatus };
