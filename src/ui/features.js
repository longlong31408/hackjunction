// Should-haves: breathing in the Sleepy Meadow, the worry-eating cat, 3 tiny daily tasks.
import { el, openPanel, closePanel, toast } from './hud.js';
import { pickLine } from '../brain/dialogue.js';
import { state } from '../brain/state.js';
import { checkSafety } from '../brain/safety.js';
import tasks from '../data/tasks.json';

/**
 * app: { say, sayCtx, home, showScene, currentScene, openHelp, openTypeBox, captureNextTalk,
 *        registerEffect, catName(), sound? }
 */
export function installFeatures(app) {
  app.registerEffect('breathe', (done) => breathe(app, typeof done === 'function' ? done : null));
  app.registerEffect('tasks', (done) => openTasks(app, typeof done === 'function' ? done : null));
  app.registerEffect('worry', (done) => askWorry(app, typeof done === 'function' ? done : null));
  app.registerEffect('worrysay', () => {
    app.captureNextTalk((text) => eatWorry(app, text));
    toast('Hold 🎙️ Talk and say the worry. I\'m hungry 😋', 3000);
  });
  app.registerEffect('worrytype', () => app.openTypeBox('Type the worry. I\'ll eat it — nothing is saved.', (text) => eatWorry(app, text)));
  document.getElementById('worryBtn').addEventListener('click', () => askWorry(app));
}

// ------------------------------------------------------------------ breathing (1 minute, expanding circle)
const IN = 4000, OUT = 6000, TOTAL = 60000;
export function breathe(app, done) {
  const circle = el('div', { class: 'breath-circle', 'aria-hidden': 'true' }, '🐱');
  const cue = el('p', { class: 'breath-cue', 'aria-live': 'polite' }, 'Ready when you are.');
  const left = el('p', { class: 'small' }, '1 minute · 4 seconds in, 6 seconds out');
  const start = el('button', { class: 'btn primary' }, 'Start');
  let timers = [], running = false, tick = 0, t0 = 0;
  const reduce = document.documentElement.classList.contains('reduce');
  const stop = () => { timers.forEach(clearTimeout); timers = []; clearInterval(tick); running = false; };
  const cycle = (t0) => {
    const elapsed = Date.now() - t0;
    if (elapsed >= TOTAL) {
      cue.textContent = 'All done. ' + app.catName() + ' is very relaxed now. 💛';
      left.textContent = ''; circle.style.transform = 'scale(0.55)'; start.textContent = 'Again'; running = false; clearInterval(tick);
      if (done) { const d = done; done = null; setTimeout(() => { panel.close(); d(); }, 2200); }
      return;
    }
    cue.textContent = 'Breathe in…';
    circle.style.transitionDuration = IN + 'ms';
    circle.style.transform = reduce ? 'scale(0.8)' : 'scale(1)';
    circle.style.background = reduce ? 'var(--mint)' : '';
    timers.push(setTimeout(() => {
      cue.textContent = 'And out…';
      circle.style.transitionDuration = OUT + 'ms';
      circle.style.transform = reduce ? 'scale(0.8)' : 'scale(0.55)';
      circle.style.background = reduce ? 'var(--lavender)' : '';
      timers.push(setTimeout(() => cycle(t0), OUT));
    }, IN));
  };
  start.addEventListener('click', () => {
    if (running) return;
    stop(); running = true; start.textContent = 'Breathing…'; t0 = Date.now();
    const show = () => { left.textContent = Math.max(0, Math.ceil((TOTAL - (Date.now() - t0)) / 1000)) + ' seconds left'; };
    show(); tick = setInterval(show, 1000);
    cycle(t0);
  });
  const panel = openPanel({
    title: app.currentScene() === 'World' ? '☁️ Breathe with the clouds' : '🫁 Breathe with ' + app.catName(),
    className: 'breath', onClose: stop,
    body: el('div', { class: 'breath' }, circle, cue, left, start),
  });
}

// ------------------------------------------------------------------ worry-eating cat (nothing is stored)
let worryDone = null;
function askWorry(app, done) {
  worryDone = done || null;
  const line = pickLine('worry_ask', state);
  if (!line) return;
  line.choices = [{ label: '🎙️ Say it', effect: 'worrysay' }, { label: '⌨️ Type it', effect: 'worrytype' }];
  app.showScene('Home');
  app.say(line);
}

export function eatWorry(app, text) {
  text = (text || '').trim();
  if (!text) return app.sayCtx('missed');
  const risk = checkSafety(text);              // safety first, even for worries
  if (risk >= 2) return app.openHelp(risk);
  app.showScene('Home');
  app.sound?.('chomp');
  app.home().eatWorry(() => {
    app.sayCtx('worry_eaten');
    if (worryDone) { const d = worryDone; worryDone = null; setTimeout(d, 3000); }
    if (risk === 1) setTimeout(() => app.say(pickLine('gentle_check', state), { chip: true, onChip: () => app.openHelp(1) }), 3500);
  });
  text = null;                                 // gone — never kept
}

// ------------------------------------------------------------------ 3 tiny daily tasks, sized to energy
const done = new Map();                        // today's taps, in memory only (no streaks, nothing stored)

function seeded(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }
export function todaysTasks(energy, date = new Date()) {
  const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const rnd = seeded(key * 7 + energy);
  const fits = (spread) => tasks.filter((t) => energy >= t.energy[0] - spread && energy <= t.energy[1] + spread);
  let pool = fits(0);
  if (pool.length < 3) pool = fits(1);
  pool = pool.slice().sort(() => rnd() - 0.5);
  return pool.slice(0, 3);
}

function openTasks(app, finished) {
  const list = el('div');
  const render = () => {
    list.innerHTML = '';
    list.append(el('p', { class: 'small' }, 'Three tiny things for today\'s energy. Doing none of them is completely fine.'));
    for (const t of todaysTasks(state.energy)) {
      const status = done.get(t.id);
      const row = el('div', { class: 'task' + (status ? ' ' + status : '') }, el('p', {}, t.text));
      if (status) {
        row.append(el('p', { class: 'small' }, status === 'done' ? '✓ Done — ' + app.catName() + ' noticed 💛' : '💤 Rested instead. That counts.'));
      } else {
        row.append(el('div', { class: 'row' },
          el('button', { class: 'btn primary', onclick: () => { done.set(t.id, 'done'); app.sound?.('sparkle'); closePanel(); app.showScene('Home'); app.sayCtx('task_done'); app.home()?.burst('spark', 6); if (finished) setTimeout(finished, 3000); } }, '✓ Did it'),
          el('button', { class: 'btn', onclick: () => { done.set(t.id, 'skipped'); closePanel(); app.sayCtx('task_skip'); } }, '💤 Skip')));
      }
      list.append(row);
    }
    list.append(el('p', { class: 'small' }, 'No streaks, no scores. Tomorrow is a fresh, gentle list.'));
  };
  render();
  openPanel({ title: '🧶 Tiny tasks', body: list });
}
