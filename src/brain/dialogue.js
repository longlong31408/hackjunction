import lines from '../data/dialogue.json';

const recent = [];              // ids of recently used lines, so the cat doesn't repeat itself
const RECENT_MAX = 30;

// context: 'greeting' | 'confirm' | 'reply' | 'suggest_place' | 'task' | 'turtle' | ...
// tag: a place (suggest_place, arrive) or a topic (reply). Without a tag, tagged lines are skipped.
// vars fill {word} {area} {summary} — always words from brain/topics.js / understand.js, never free text.
export function pickLine(context, state, speaker = null, tag = null, vars = {}) {
  const fits = lines.filter((l) =>
    (!speaker || l.speaker === speaker) &&
    l.context === context &&
    (tag ? l.tag === tag : !l.tag || l.context === 'arrive') &&
    (!l.mood || l.mood.includes(state.mood)) &&
    (!l.energy || (state.energy >= l.energy[0] && state.energy <= l.energy[1])));
  const fresh = fits.filter((l) => !recent.includes(l.id));
  const pool = fresh.length ? fresh : fits;
  const line = pool[Math.floor(Math.random() * pool.length)];
  if (!line) return null;
  recent.push(line.id);
  if (recent.length > RECENT_MAX) recent.shift();
  let text = line.text
    .replace(/\{word\}/g, vars.word || 'like this')
    .replace(/\{area\}/g, vars.area || 'everything')
    .replace(/\{summary\}/g, vars.summary || 'a lot has been going on');
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return { ...line, text };   // { id, speaker, context, text, anim, choices?, tag? }
}

export const allLines = () => lines;
