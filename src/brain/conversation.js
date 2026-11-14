// The cat's way of talking, built from the research in docs/CONVERSATION_GUIDE.md:
// reflect first → validate or affirm → one next move (a single open question, a summary,
// or a small activity that fits). Every piece is a pre-written line from content/dialogue.csv.
import { understand, areaPhrase } from './understand.js';
import { pickLine } from './dialogue.js';
import { rank, ACTIVITIES, isNight } from './coach.js';
import { isNegativeTopic } from './topics.js';

// Session memory — what was said this session. Never stored; gone when the app closes.
export const memory = {};
export function resetMemory() {
  Object.assign(memory, {
    turns: 0, feelings: [], areas: [], questionsInRow: 0, sinceSummary: 0,
    offered: new Map(), done: new Set(), lastTopic: null, threadTurns: 0, lastOffer: null, lastWord: null,
  });
}
resetMemory();

const MAX_QUESTIONS_IN_ROW = 2;      // MI: never three questions in a row
const HEAVY_SHARE = new Set(['sad', 'lonely', 'grief', 'shame', 'stressed']);   // disclosures that deserve "thank you for trusting me"
const join = (xs) => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);
const uniq = (xs) => [...new Set(xs)];

function compose(parts) {
  parts = parts.filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1];
  return {
    id: 'conv-' + parts.map((p) => p.id).join('+'), speaker: 'cat', context: 'conversation',
    text: parts.map((p) => p.text).join(' '), anim: parts[0].anim, choices: last.choices,
  };
}

/** The summary in the cat's words — built only from feeling words and life areas it recognised. */
export function summaryText() {
  const feelings = uniq(memory.feelings.filter((f) => isNegativeTopic(f.topic)).map((f) => f.word)).slice(-2);
  const areas = uniq(memory.areas).slice(-2).map(areaPhrase);
  if (areas.length && feelings.length) return `there's been a lot going on with ${join(areas)}, and you've been feeling ${join(feelings)}`;
  if (areas.length) return `there's been a lot going on with ${join(areas)}`;
  return `you've been feeling ${join(feelings)}`;
}

/** One small activity that fits right now, with the reason and the way out. */
export function offer(state, opts = {}) {
  const ids = rank({ ...state, topic: memory.lastTopic, word: memory.lastWord, night: isNight(), done: memory.done, offered: memory.offered })
    .filter((id) => id !== opts.except);
  const id = ids[0];
  memory.offered.set(id, (memory.offered.get(id) || 0) + 1);
  memory.lastOffer = id;
  memory.questionsInRow = 0;
  const line = pickLine('offer', state, 'cat', id, { word: memory.lastWord || ACTIVITIES[id].word });
  if (!line) return null;
  line.choices = [
    { label: ACTIVITIES[id].label, effect: 'act:' + id },
    { label: 'Something else', effect: 'more' },
    { label: 'Keep talking 🎙️', effect: 'talk' },
  ];
  return line;
}

/**
 * The cat's reply to one message. Call after the safety check and after update(state).
 * Returns a line object ready for say().
 */
export function respond(text, state, a = understand(text)) {
  memory.turns++;
  memory.sinceSummary++;
  const negative = !!(a.topic && isNegativeTopic(a.topic));
  const repeat = a.topic && memory.feelings.some((f) => f.topic === a.topic) && memory.lastTopic !== a.topic;
  if (a.topic) { memory.feelings.push({ topic: a.topic, word: a.word }); memory.lastWord = a.word; }
  if (a.area && !memory.areas.includes(a.area)) memory.areas.push(a.area);
  memory.threadTurns = a.topic && a.topic === memory.lastTopic ? memory.threadTurns + 1 : (a.topic || a.area ? 1 : memory.threadTurns + 1);
  if (a.topic) memory.lastTopic = a.topic;
  const vars = { word: a.word, area: areaPhrase(a.area) };
  const topic = a.topic || memory.lastTopic;

  // Short answers: accept them gently (WHO PFA: don't pressure people to talk).
  if (!a.topic && !a.area) {
    if (a.thanks) return compose([pickLine('thanks_user', state)]);
    if (a.idk) return compose([pickLine('idk', state), offer(state)]);
    if (a.short) {
      const parts = [pickLine('short', state)];
      if (memory.questionsInRow < MAX_QUESTIONS_IN_ROW && topic) { parts.push(pickLine('ask', state, 'cat', topic)); memory.questionsInRow++; }
      return compose(parts);
    }
  }

  const parts = [];
  // 1. Reflect (a statement, in their own feeling word)
  if (a.topic) parts.push(pickLine('reflect', state, 'cat', a.topic, vars));
  else if (a.area) parts.push(pickLine('reflect_area', state, 'cat', a.area));
  else parts.push(pickLine('reply', state, 'cat'));
  if (repeat) parts.push(pickLine('callback', state, 'cat', null, vars));

  // 2. Validate or affirm — one of them, the most specific that fits
  if (a.effort) parts.push(pickLine('affirm', state, 'cat', 'effort'));
  else if (negative && a.area) parts.push(pickLine('validate', state, 'cat', 'area', vars));
  else if (negative && a.lasting) parts.push(pickLine('validate', state, 'cat', 'lasting'));
  else if (HEAVY_SHARE.has(a.topic) && memory.feelings.filter((f) => isNegativeTopic(f.topic)).length === 1) parts.push(pickLine('affirm', state, 'cat', 'sharing'));
  else if (negative && !repeat && memory.turns % 2 === 0) parts.push(pickLine('validate', state, 'cat', 'normalize'));

  // 3. One next move
  const heard = memory.feelings.length + memory.areas.length;
  if (negative && memory.sinceSummary >= 3 && heard >= 2) {
    parts.push(pickLine('summary', state, 'cat', null, { summary: summaryText() }));   // S of OARS
    memory.sinceSummary = 0; memory.questionsInRow = 0;
  } else if (a.topic === 'tired' && state.energy <= 1) {
    parts.push(offer(state));                                   // too tired right now to be asked questions
  } else if (memory.questionsInRow < MAX_QUESTIONS_IN_ROW && memory.threadTurns <= 2) {
    const q = (a.area && pickLine('ask_area', state, 'cat', a.area)) || pickLine('ask', state, 'cat', topic || 'open');
    parts.push(q);
    memory.questionsInRow++;
  } else {
    parts.push(offer(state));
  }
  return compose(parts);
}

/** Follow-ups to tap choices. */
export function summaryAnswer(yes, state) {
  if (yes) return compose([pickLine('affirm', state, 'cat', 'heard'), offer(state)]);
  return compose([pickLine('summary_fix', state)]);
}
export function another(state) { return offer(state, { except: memory.lastOffer }); }

/** After an activity: check in (behavioural activation — notice what helps). */
export function afterActivity(id, state) {
  memory.done.add(id);
  return pickLine('after', state);
}
export function afterAnswer(how, state) {
  if (how === 'better') return compose([pickLine('after_better', state)]);
  if (how === 'same') return compose([pickLine('after_same', state), offer(state)]);
  return compose([pickLine('after_worse', state)]);
}
