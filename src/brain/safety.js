import phrases from '../data/crisis_phrases.json';

// Lowercase, unify apostrophes (Whisper often writes ’), drop them, keep letters only.
// "Don’t" and "dont" both become "dont", so phrase lists only need one spelling.
const norm = (s) => ' ' + String(s || '').toLowerCase()
  .replace(/[’‘`]/g, "'").replace(/'/g, '')
  .replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';

const LISTS = {
  urgent: phrases.urgent.map(norm),
  high: phrases.high.map(norm),
  concern: phrases.concern.map(norm),
  ignore: phrases.ignore.map(norm),
};
const hit = (t, list) => list.some((p) => t.includes(p));

/**
 * Returns 0 none · 1 concern · 2 high · 3 urgent.
 * Runs on every piece of text before anything else (golden rule 1).
 *
 * Known idioms ("this homework is killing me") are removed first instead of
 * short-circuiting, so a message that mixes an idiom with a real crisis phrase
 * ("this is killing me, I want to die") is still caught.
 */
export function checkSafety(text) {
  let t = norm(text);
  for (const idiom of LISTS.ignore) t = t.split(idiom).join(' ');
  t = ' ' + t.replace(/\s+/g, ' ').trim() + ' ';
  if (hit(t, LISTS.urgent)) return 3;
  if (hit(t, LISTS.high)) return 2;
  if (hit(t, LISTS.concern)) return 1;
  return 0;
}
