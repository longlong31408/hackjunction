// Combines face, voice and words into { energy 1–5, mood, need, confidence }.
// Face = hint, words = stronger signal, the user's own answer = truth.
import { TOPICS, isNegativeTopic } from './topics.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
let faceWindow = [];               // last 10 seconds of face samples (memory only)
let lock = null;                   // user corrections win for 30 minutes
const listeners = new Set();

export const MOODS = ['heavy', 'low', 'neutral', 'light', 'bright'];
export const state = { energy: 3, mood: 'neutral', need: 'company', confidence: 0.2 };

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = () => listeners.forEach((fn) => fn({ ...state }));

export function addFace(sample) {
  faceWindow.push(sample);
  faceWindow = faceWindow.filter((s) => sample.t - s.t < 10000);
}
export function clearFace() { faceWindow = []; }

/** Averages of the last 10 s, for the debug panel. */
export function faceSummary() {
  const faces = faceWindow.filter((s) => s.present);
  if (!faces.length) return null;
  const avg = (k) => faces.reduce((a, s) => a + s[k], 0) / faces.length;
  return { smile: avg('smile'), frown: avg('frown'), browSad: avg('browSad'), eyeOpen: avg('eyeOpen'), n: faces.length };
}

const WORDS = {
  energyLow: ['tired', 'exhausted', 'sleepy', "can't get up", 'cant get up', 'drained', 'no energy', 'worn out'],
  energyHigh: ['energetic', "let's go", 'lets go', 'excited', 'pumped', 'great day', 'feel great'],
  needVent: ['talk', 'listen', 'vent', 'tell you'],
  needDistract: ['bored', 'distract', 'something fun'],
  needRest: ['rest', 'sleep', 'nap'],
};
const has = (text, list) => list.some((w) => text.toLowerCase().includes(w));

// Call with whatever is available: { text, valence, loudness, topic }
// topic (from brain/topics.js) is what the person said they feel — it outranks the sentiment model.
export function update({ text, valence, loudness, topic } = {}) {
  if (lock && Date.now() < lock.until) return state;

  const energyVotes = [], moodVotes = [];         // [value, weight]
  const faces = faceWindow.filter((s) => s.present);

  if (faces.length >= 5) {                         // FACE — weight 0.3
    const avg = (k) => faces.reduce((a, s) => a + s[k], 0) / faces.length;
    energyVotes.push([1 + 4 * clamp(avg('eyeOpen') * 0.7 + avg('smile') * 0.3, 0, 1), 0.3]);
    moodVotes.push([clamp(avg('smile') - avg('frown') - 0.5 * avg('browSad'), -1, 1), 0.3]);
  }
  if (loudness != null) {                          // VOICE — weight 0.4 (tune by testing!)
    energyVotes.push([1 + 4 * clamp(loudness * 8, 0, 1), 0.4]);
  }
  if (text) {                                      // WORDS — weight 0.7
    const T = topic && TOPICS[topic];
    // "I was really tired" must never read as cheerful, even if the sentiment model says POSITIVE.
    if (T && isNegativeTopic(topic) && (valence == null || valence > T.valence)) valence = T.valence;
    if (T && !isNegativeTopic(topic) && (valence == null || valence < 0.2)) valence = T.valence;
    if (valence != null) moodVotes.push([valence, 0.7]);
    const intense = /\b(really|so|very|extremely|completely|totally|super)\b/i.test(text);
    if (has(text, WORDS.energyLow)) energyVotes.push([intense ? 1 : 2, 0.7]);   // "really tired" → 1, "tired" → 2
    if (has(text, WORDS.energyHigh)) energyVotes.push([4.5, 0.7]);
    state.need = has(text, WORDS.needVent) ? 'vent'
      : has(text, WORDS.needDistract) ? 'distract'
        : has(text, WORDS.needRest) ? 'rest' : state.need;
    if (T) state.need = T.need;
  }

  const wavg = (v) => v.reduce((a, [x, w]) => a + x * w, 0) / v.reduce((a, [, w]) => a + w, 0);
  if (energyVotes.length) state.energy = Math.round(clamp(wavg(energyVotes) + 1e-9, 1, 5));   // +1e-9: 1.4999… must round like 1.5
  if (moodVotes.length) {
    const m = wavg(moodVotes);
    state.mood = m < -0.6 ? 'heavy' : m < -0.2 ? 'low' : m < 0.2 ? 'neutral' : m < 0.6 ? 'light' : 'bright';
  }
  const totalWeight = [...energyVotes, ...moodVotes].reduce((a, [, w]) => a + w, 0);
  if (totalWeight) state.confidence = clamp(totalWeight / 2, 0, 1);
  if (topic) state.confidence = Math.max(state.confidence, 0.8);   // they told us; no need to guess

  if (!text && energyVotes.length) state.need = state.energy <= 2 ? 'rest' : state.energy >= 4 ? 'distract' : 'company';
  emit();
  return state;
}

// When the user answers "No, I'm just sad" etc. — their answer is the truth.
export function correct(fields) {
  Object.assign(state, fields, { confidence: 1 });
  lock = { until: Date.now() + 30 * 60 * 1000 };
  emit();
}
export const isLocked = () => !!(lock && Date.now() < lock.until);

/** Restore the last remembered energy/mood (low confidence: it's yesterday's news). */
export function restore({ energy, mood } = {}) {
  if (energy >= 1 && energy <= 5) state.energy = energy;
  if (MOODS.includes(mood)) state.mood = mood;
  emit();
}

export function resetState() {
  Object.assign(state, { energy: 3, mood: 'neutral', need: 'company', confidence: 0.2 });
  faceWindow = []; lock = null;
}
