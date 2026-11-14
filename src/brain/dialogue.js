import lines from '../data/dialogue.json';

const recent = [];              // ids of recently used lines, so the cat doesn't repeat itself
const RECENT_MAX = 30;

// context: 'greeting' | 'confirm' | 'reply' | 'suggest_place' | 'task' | 'turtle' | ...
export function pickLine(context, state, speaker = null, tag = null) {
  const fits = lines.filter((l) =>
    (!speaker || l.speaker === speaker) &&
    l.context === context &&
    (!tag || l.tag === tag) &&
    (!l.mood || l.mood.includes(state.mood)) &&
    (!l.energy || (state.energy >= l.energy[0] && state.energy <= l.energy[1])));
  const fresh = fits.filter((l) => !recent.includes(l.id));
  const pool = fresh.length ? fresh : fits;
  const line = pool[Math.floor(Math.random() * pool.length)];
  if (!line) return null;
  recent.push(line.id);
  if (recent.length > RECENT_MAX) recent.shift();
  return { ...line };   // { id, speaker, context, text, anim, choices?, tag? }
}

export const allLines = () => lines;
