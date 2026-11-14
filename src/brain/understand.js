// Reads a message for what a good listener would notice: the feeling (topic), the part of
// life it's about, how strong and how long-lasting it is, and signs of effort.
// Only words from these lists are ever said back — never the person's free text.
import { detectTopic, TOPICS, ORDER } from './topics.js';

// area → [match words, how the cat refers to it]
export const AREAS = {
  work: [['work', 'job', 'boss', 'office', 'shift', 'colleague', 'coworker', 'manager', 'workload'], 'work'],
  school: [['school', 'class', 'exam', 'exams', 'homework', 'study', 'studying', 'teacher', 'university', 'uni', 'assignment', 'deadline', 'thesis', 'grades', 'course'], 'school'],
  family: [['mom', 'mum', 'dad', 'parents', 'family', 'brother', 'sister', 'my kids', 'my son', 'my daughter', 'at home'], 'things at home'],
  relationship: [['boyfriend', 'girlfriend', 'partner', 'husband', 'wife', 'breakup', 'broke up', 'my ex', 'dating', 'relationship'], 'your relationship'],
  friends: [['friend', 'friends', 'roommate', 'flatmate'], 'your friends'],
  sleep: [['sleep', 'slept', 'insomnia', 'awake all night', 'nightmare', 'nightmares', 'cant sleep', "can't sleep"], 'sleep'],
  health: [['sick', 'ill', 'pain', 'headache', 'doctor', 'hospital', 'migraine'], 'your health'],
  money: [['money', 'rent', 'bills', 'debt', 'broke', 'afford'], 'money'],
};
const INTENSE = /\b(really|so|very|extremely|super|completely|totally|incredibly|so much|too much|unbearabl\w*)\b/;
const MILD = /\b(a bit|kind of|kinda|a little|slightly|sort of|somewhat)\b/;
const LASTING = /\b(always|every day|everyday|all the time|all week|for weeks|for months|for days|lately|recently|again|constantly|since)\b/;
const EFFORT = /\b(i tried|i managed|i still|i went|i did|i finished|i got up|i made it|i talked to|i called)\b/;
const IDK = /^\s*(i\s*(don'?t|do not)\s*know|idk|dunno|not sure|i'?m not sure|no idea|nothing|i guess)\W*$/;
const THANKS = /\b(thank you|thanks|thank u|thx|ty)\b/;
const SHORT = /^\s*(yes|yeah|yep|no|nope|nah|ok|okay|maybe|sure|mhm|hm+)\W*$/;

const norm = (s) => ' ' + String(s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';

export function findArea(text) {
  const t = norm(text);
  for (const [area, [words]] of Object.entries(AREAS)) {
    if (words.some((w) => t.includes(' ' + w + ' '))) return area;
  }
  return null;
}

/** Everything the cat notices in one message. */
export function understand(text) {
  const raw = String(text || '').toLowerCase();
  const found = detectTopic(text);
  return {
    topic: found?.topic || null,
    word: found?.word || null,
    area: findArea(text),
    intense: INTENSE.test(raw) && !MILD.test(raw),
    mild: MILD.test(raw),
    lasting: LASTING.test(raw),
    effort: EFFORT.test(raw),
    idk: IDK.test(raw),
    thanks: THANKS.test(raw),
    short: SHORT.test(raw),
  };
}

export const areaPhrase = (area) => (area ? AREAS[area][1] : null);
export { TOPICS, ORDER };
