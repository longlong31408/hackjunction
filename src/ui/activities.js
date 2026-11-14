// Small activities the cat can suggest (behavioural activation: small, doable, matched to energy).
// Each one calls done() when it finishes, so the cat can gently check in: "How do you feel now?"
import { el, openPanel, closePanel } from './hud.js';
import { checkSafety } from '../brain/safety.js';
import { initSound, setMusic } from './sound.js';
import { saveSettings } from '../storage.js';

/** app: { say, sayCtx, home, showScene, openHelp, openTypeBox, captureNextTalk, registerActivity, effects, restTogether, catName } */
export function installActivities(app) {
  app.registerActivity('ground', (done) => grounding(app, done));
  app.registerActivity('stretch', (done) => stretch(app, done));
  app.registerActivity('play', (done) => play(app, done));
  app.registerActivity('goodthing', (done) => goodThing(app, done));
  app.registerActivity('reach', (done) => reach(app, done));
  app.registerActivity('winddown', () => windDown(app));
}

// ------------------------------------------------------------------ 5-4-3-2-1 grounding
const SENSES = [
  [5, '👀', 'Look around. Find 5 things you can see.'],
  [4, '✋', 'Notice 4 things you can feel: your feet on the floor, your clothes, the air…'],
  [3, '👂', 'Listen for 3 sounds, near or far.'],
  [2, '👃', 'Find 2 things you can smell, or 2 smells you like.'],
  [1, '💧', 'Notice 1 thing you can taste, or take one slow sip of water.'],
];
function grounding(app, done) {
  let step = 0, found = 0;
  const big = el('div', { class: 'ground-big', 'aria-hidden': 'true' });
  const text = el('p', { class: 'breath-cue' });
  const dots = el('div', { class: 'ground-dots', 'aria-hidden': 'true' });
  const btn = el('button', { class: 'btn primary' });
  const skip = el('button', { class: 'btn ghost' }, 'Next sense →');
  const render = () => {
    const [n, icon, line] = SENSES[step];
    big.textContent = icon + ' ' + n;
    text.textContent = line;
    dots.innerHTML = '';
    for (let i = 0; i < n; i++) dots.append(el('span', { class: i < found ? 'on' : '' }, '🐾'));
    btn.textContent = found < n ? `Found one (${found}/${n})` : 'Next';
  };
  const next = () => {
    found = 0; step++;
    if (step >= SENSES.length) { panel.close(); app.home()?.setPose('happy'); app.sayCtx('ground_end'); setTimeout(() => app.home()?.setPose(null), 4000); done?.(); return; }
    render();
  };
  btn.addEventListener('click', () => { const n = SENSES[step][0]; if (found < n) { found++; render(); if (found === n) setTimeout(next, 600); } else next(); });
  skip.addEventListener('click', next);
  const panel = openPanel({
    title: '👀 5-4-3-2-1 with ' + app.catName(),
    body: el('div', { class: 'breath' }, el('p', { class: 'small' }, 'A little game to come back to right here, right now. No need to say anything out loud.'),
      big, text, dots, el('div', { class: 'stack' }, btn, skip)),
  });
  render();
}

// ------------------------------------------------------------------ stretch with me (3 gentle stretches)
const STRETCHES = [
  ['🙆', 'Reach both arms up high, like a cat after a nap.'],
  ['🔄', 'Roll your shoulders slowly backwards, five times.'],
  ['🌙', 'Let your head tip gently to one side, then the other.'],
];
function stretch(app, done) {
  const SECS = 20;
  let i = 0, left = SECS, timer = 0;
  const icon = el('div', { class: 'ground-big', 'aria-hidden': 'true' });
  const text = el('p', { class: 'breath-cue' });
  const count = el('p', { class: 'small' });
  const start = el('button', { class: 'btn primary' }, 'Start');
  const show = () => { icon.textContent = STRETCHES[i][0]; text.textContent = STRETCHES[i][1]; count.textContent = `Stretch ${i + 1} of 3`; };
  const tick = () => {
    left--; count.textContent = `Stretch ${i + 1} of 3 · ${left}s`;
    if (left > 0) return;
    i++; left = SECS;
    if (i >= STRETCHES.length) {
      clearInterval(timer); panel.close(); app.home()?.setPose(null); app.sayCtx('stretch_end'); done?.(); return;
    }
    show();
  };
  start.addEventListener('click', () => { if (timer) return; start.textContent = 'Stretching…'; app.home()?.setPose('stretch'); timer = setInterval(tick, 1000); });
  const panel = openPanel({
    title: '🙆 Stretch with ' + app.catName(), onClose: () => { clearInterval(timer); app.home()?.setPose(null); },
    body: el('div', { class: 'breath' }, el('p', { class: 'small' }, 'Three gentle stretches, 20 seconds each. Only as far as feels comfortable.'), icon, text, count, start),
  });
  show();
}

// ------------------------------------------------------------------ play with me (yarn chase in the room)
function play(app, done) {
  app.showScene('Home');
  app.sayCtx('play_start');
  const stop = el('button', { id: 'playStop', class: 'pill-btn' }, '✓ Done playing');
  document.body.append(stop);
  const end = () => {
    stop.remove();
    app.home()?.stopPlay();
    app.sayCtx('play_end');
    done?.();
  };
  stop.addEventListener('click', end);
  app.home()?.startPlay(() => { if (stop.isConnected) end(); });   // also ends by itself after a while
}

// ------------------------------------------------------------------ one good thing (savouring; never stored)
function goodThing(app, done) {
  app.openTypeBox('Tell me one good thing from today. Tiny counts: a warm drink, a nice song, a kind message.', (text) => {
    const risk = checkSafety(text);                 // safety first, always
    if (risk >= 2) return app.openHelp(risk);
    app.showScene('Home');
    app.home()?.setPose('happy');
    app.home()?.burst('spark', 6);
    app.sayCtx('good_heard');
    setTimeout(() => app.home()?.setPose(null), 4000);
    done?.();
  });
}

// ------------------------------------------------------------------ message someone (link to real people)
function reach(app, done) {
  const options = [
    'Hey, I was thinking about you. How are you doing?',
    'Hi! Could we talk or meet up sometime soon? I\'d really like that.',
    'Hey, I\'m having a bit of a rough day. Would you be up for a chat?',
  ];
  const msg = el('textarea', { rows: 3, 'aria-label': 'Your message' }, options[0]);
  const note = el('p', { class: 'small' });
  const body = el('div', {},
    el('p', {}, 'Is there someone who would be glad to hear from you? Pick a message, change it as you like, and send it from your phone.'),
    el('div', { class: 'stack' }, options.map((o) => el('button', { class: 'btn ghost', onclick: () => { msg.value = o; } }, o))),
    msg,
    el('button', { class: 'btn primary', onclick: async () => {
      try {
        if (navigator.share) await navigator.share({ text: msg.value });
        else { await navigator.clipboard.writeText(msg.value); note.textContent = 'Copied! Paste it into a message. 💛'; return; }
        panel.close(); app.sayCtx('reach_done'); done?.();
      } catch { /* share cancelled */ }
    } }, '📤 Send or copy'),
    note,
    el('p', { class: 'small' }, 'Mochi doesn\'t send anything itself and doesn\'t keep the message.'));
  const panel = openPanel({ title: '💌 Reach out', body });
}

// ------------------------------------------------------------------ wind down for sleep
function windDown(app) {
  app.showScene('Home');
  initSound();
  saveSettings({ music: true });
  setMusic(true);
  app.sayCtx('winddown');
  setTimeout(() => app.effects.breathe?.(() => app.restTogether()), 3500);
}
