// Which small activity fits this person right now? (behavioural activation: small, graded,
// matched to energy — see docs/CONVERSATION_GUIDE.md). Always an offer, never an order.
export const ACTIVITIES = {
  rest: { label: 'Rest with me 💤', word: 'tired' },
  breathe: { label: 'Breathe together 🫁', word: 'stressed' },
  ground: { label: 'Try 5-4-3-2-1 👀', word: 'overwhelmed' },
  worry: { label: 'Feed you the worry 😋', word: 'worried' },
  turtle: { label: 'Visit Old Turtle 🐢', word: 'lonely' },
  meadow: { label: 'Lie in the meadow ☁️', word: 'tired' },
  beach: { label: 'Walk to the beach 🏖️', word: 'bored' },
  tasks: { label: 'One tiny task 🧶', word: 'low' },
  stretch: { label: 'Stretch with me 🙆', word: 'low' },
  play: { label: 'Play with me 🐾', word: 'bored' },
  goodthing: { label: 'One good thing ✨', word: 'happy' },
  reach: { label: 'Message someone 💌', word: 'lonely' },
  winddown: { label: 'Wind down for sleep 🌙', word: 'tired' },
  couch: { label: 'Watch me wander 🛋️', word: 'tired' },
};

const PANICKY = new Set(['panicky', 'scared', 'overwhelmed', 'anxious']);
const HEAVY = new Set(['sad', 'grief', 'lonely', 'shame']);

/**
 * ctx: { energy, mood, need, topic, word, night, done: Set, offered: Map<id, count> }
 * Returns activity ids, best first.
 */
export function rank(ctx) {
  const { energy = 3, mood = 'neutral', need = 'company', topic = null, word = null, night = false } = ctx;
  const low = mood === 'low' || mood === 'heavy';
  const s = {};
  const add = (id, n) => { s[id] = (s[id] || 0) + n; };

  // rest & passive things when energy is very low
  if (topic === 'tired') add('rest', 3);
  else if (energy <= 1 && !topic) add('rest', 2);
  else if (energy <= 1) add('rest', 0.5);
  if (energy === 2) add('rest', 1.5);
  if (need === 'rest') add('rest', 1);
  if (topic === 'grief' || topic === 'sad') add('rest', 1);
  if (energy <= 1 && (!topic || topic === 'tired')) add('couch', 2);
  if (topic === 'tired') add('couch', 0.3);
  if (night && (topic === 'tired' || energy <= 2)) add('winddown', 4);
  if (night) add('winddown', 1);
  if (topic === 'tired' && energy >= 2) add('meadow', 2);

  // calming
  if (topic === 'stressed' || topic === 'angry') add('breathe', 3);
  if (mood === 'heavy') add('breathe', 1.5);
  if (PANICKY.has(word)) add('ground', 3.5);
  if (topic === 'stressed') { add('ground', 2); add('worry', word === 'worried' || word === 'stressed' ? 3 : 1.5); add('meadow', 1.5); }
  if (topic === 'shame') { add('worry', 2); add('breathe', 1.5); add('reach', 1); }

  // company
  if (topic === 'lonely') { add('turtle', 3); if (energy >= 2) add('reach', 3); }
  if (topic === 'sad' || topic === 'grief') add('turtle', 2);
  if (topic === 'grief') add('reach', 1);
  if (need === 'vent') add('turtle', 1);

  // gentle activation (small, pleasant, doable)
  if (low && energy >= 2 && energy <= 3) { add('tasks', 2); add('stretch', 2); }
  if (topic === 'tired' && energy >= 2) add('stretch', 1);
  if (topic === 'bored') { add('play', 3); add('beach', 2.5); add('tasks', 1.5); add('stretch', 1); }
  if (topic === 'angry' && energy >= 3) add('beach', 2.5);
  if (energy <= 1) add('tasks', -2);

  // good days: savour them
  if (topic === 'happy' || mood === 'light' || mood === 'bright') { add('goodthing', 2.5); if (energy >= 3) { add('play', 2.5); add('beach', 1); } }
  if (HEAVY.has(topic)) add('play', -3);

  // don't repeat: done this session, or offered and not taken
  for (const id of Object.keys(ACTIVITIES)) {
    if (!(id in s)) s[id] = 0;
    if (ctx.done?.has(id)) s[id] -= 4;
    s[id] -= 1.5 * (ctx.offered?.get(id) || 0);
  }
  if (energy >= 3 && !night && !low) add('play', 0.5);   // a gentle default for okay days
  return Object.keys(s).sort((a, b) => s[b] - s[a]);
}

export const isNight = (d = new Date()) => d.getHours() >= 22 || d.getHours() < 5;
