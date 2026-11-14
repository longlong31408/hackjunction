import { state } from './state.js';
import { pickLine } from './dialogue.js';

// When does the cat speak first? Gentle on purpose: a gap between questions,
// a cap per session, and "Not now" really means quiet for 15 minutes.
export const rules = { minGapMs: 45000, maxQuestions: 4, tickMs: 3000, greetDelayMs: 3000, snoozeMs: 15 * 60 * 1000 };
let lastAsk = 0, asked = 0, snoozeUntil = 0, quiet = false, timers = [], suggested = false;
let show = null, busy = () => false, makeOffer = null;

/** Which calm place fits the current state (table in the dev guide, step 9). */
export function suggestPlace(s = state) {
  if (s.energy <= 2 || s.need === 'rest') return 'meadow';
  if ((s.mood === 'low' || s.mood === 'heavy') && s.need === 'vent') return 'beach';
  if (s.need === 'distract' && s.energy >= 3) return 'beach';
  if (s.mood === 'light' || s.mood === 'bright') return Math.random() < 0.5 ? 'beach' : 'meadow';
  return 'home';
}

/** makeOffer (optional): returns a fitting activity offer from the coach instead of a fixed place line. */
export function startDirector(showBubble, isBusy, offerFn) {
  stopDirector();
  show = showBubble; busy = isBusy || (() => false); makeOffer = offerFn || null;
  // Greet right after opening
  timers.push(setTimeout(() => say('greeting', true), rules.greetDelayMs));
  timers.push(setInterval(tick, rules.tickMs));
}

export function tick() {
  const now = Date.now();
  if (quiet || now < snoozeUntil || asked >= rules.maxQuestions || busy()) return;
  if (now - lastAsk < rules.minGapMs) return;

  if (state.confidence >= 0.4 && state.confidence < 0.75) say('confirm');        // "You look sleepy… am I right?"
  else if (state.confidence < 0.4) say('indirect');                               // "Which blanket today?"
  else if (makeOffer) { const line = makeOffer(); if (line) { lastAsk = Date.now(); asked++; show(line); } }   // a small activity that fits
  else if (!suggested) { suggested = true; say('suggest_place', false, suggestPlace()); } // "Want to see the beach?"
  else say('task');                                                               // "One tiny thing together?"
}

function say(context, isGreeting = false, tag = null) {
  if (quiet || Date.now() < snoozeUntil || busy()) return;
  const line = pickLine(context, state, null, tag);
  if (!line) return;
  lastAsk = Date.now();
  if (!isGreeting) asked++;
  show(line);
}

export function notNow() { snoozeUntil = Date.now() + rules.snoozeMs; }
export function setQuiet(q) { quiet = q; }
export function noteInteraction() { lastAsk = Date.now(); }   // the user just talked: don't pile on questions
export function stopDirector() { timers.forEach((t) => { clearTimeout(t); clearInterval(t); }); timers = []; }
export function resetDirector() { stopDirector(); lastAsk = 0; asked = 0; snoozeUntil = 0; quiet = false; suggested = false; }
export const directorStatus = () => ({ asked, snoozedFor: Math.max(0, snoozeUntil - Date.now()), quiet });
