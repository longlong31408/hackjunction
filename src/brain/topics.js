// What is the person talking about? Words are a strong signal: if someone says they are
// tired or sad, the cat answers THAT — a misfiring sentiment score can't flip it to cheerful.
//
// Each topic: match → the word the cat may say back ("Really exhausted… that sounds draining").
// Only words from these lists are ever echoed — never the user's free text.
export const TOPICS = {
  grief: {
    valence: -0.7, need: 'company', fallback: 'grieving',
    words: { 'passed away': 'grieving', died: 'grieving', 'lost my': 'grieving', grieving: 'grieving', grief: 'grieving', funeral: 'grieving', 'miss him': 'missing them', 'miss her': 'missing them', 'miss them': 'missing them', 'miss my': 'missing them' },
  },
  shame: {
    valence: -0.6, need: 'company', fallback: 'hard on yourself',
    words: { ashamed: 'ashamed', guilty: 'guilty', 'my fault': 'guilty', 'a failure': 'like a failure', 'so stupid': 'hard on yourself', embarrassed: 'embarrassed', 'not good enough': 'not good enough', useless: 'not good enough', 'let everyone down': 'guilty' },
  },
  lonely: {
    valence: -0.6, need: 'company', fallback: 'lonely',
    words: { lonely: 'lonely', 'so alone': 'lonely', 'all alone': 'lonely', 'feel alone': 'lonely', 'no one to talk': 'lonely', 'nobody to talk': 'lonely', isolated: 'isolated', 'left out': 'left out', 'no friends': 'lonely' },
  },
  sad: {
    valence: -0.7, need: 'company', fallback: 'sad',
    words: { sad: 'sad', 'feel down': 'down', 'feeling down': 'down', 'so down': 'down', 'been down': 'down', depressed: 'down', crying: 'sad', cried: 'sad', upset: 'upset', miserable: 'miserable', heartbroken: 'heartbroken', 'feel low': 'low', 'feeling low': 'low', 'feel bad': 'sad', awful: 'awful', terrible: 'awful', hopeless: 'hopeless', empty: 'empty' },
  },
  stressed: {
    valence: -0.5, need: 'vent', fallback: 'stressed',
    words: { stressed: 'stressed', stress: 'stressed', anxious: 'anxious', anxiety: 'anxious', overwhelmed: 'overwhelmed', panicking: 'panicky', panic: 'panicky', worried: 'worried', nervous: 'nervous', scared: 'scared', afraid: 'scared', frightened: 'scared', 'too much': 'overwhelmed', 'under pressure': 'stressed', 'freaking out': 'panicky' },
  },
  angry: {
    valence: -0.5, need: 'vent', fallback: 'frustrated',
    words: { angry: 'angry', annoyed: 'annoyed', frustrated: 'frustrated', furious: 'furious', 'mad at': 'angry', irritated: 'irritated', pissed: 'angry' },
  },
  tired: {
    valence: -0.35, need: 'rest', energy: 1.5, fallback: 'tired',
    words: { exhausted: 'exhausted', tired: 'tired', sleepy: 'sleepy', drained: 'drained', 'worn out': 'worn out', 'burnt out': 'burnt out', 'burned out': 'burnt out', fatigued: 'exhausted', knackered: 'exhausted', 'no energy': 'tired', "can't get up": 'tired', 'cant get up': 'tired', 'didnt sleep': 'tired', "didn't sleep": 'tired', 'no sleep': 'tired' },
  },
  bored: {
    valence: -0.1, need: 'distract', fallback: 'bored',
    words: { bored: 'bored', boring: 'bored', 'nothing to do': 'bored' },
  },
  happy: {
    valence: 0.7, need: 'company', fallback: 'happy',
    words: { happy: 'happy', great: 'great', 'good day': 'good', amazing: 'amazing', excited: 'excited', wonderful: 'wonderful', 'better today': 'better', proud: 'proud', fantastic: 'fantastic', awesome: 'awesome', 'feel good': 'good', 'feeling good': 'good' },
  },
};
export const ORDER = ['grief', 'shame', 'lonely', 'sad', 'stressed', 'angry', 'tired', 'bored', 'happy'];
const NEGATIVE = new Set(['grief', 'shame', 'lonely', 'sad', 'stressed', 'angry', 'tired', 'bored']);
export const isNegativeTopic = (t) => NEGATIVE.has(t);

const norm = (s) => ' ' + String(s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
const NEGATORS = /(?:\bnot|n't|\bnever|\bno longer|\bisn't|\bwasn't|\bnot really|\bdont|\bdidnt|\bwasnt|\bisnt)\s+(?:\w+\s+)?$/;

/** → { topic, word } or null. "not tired" doesn't count; "not happy"/"not great" means sad. */
export function detectTopic(text) {
  const t = norm(text);
  for (const topic of ORDER) {
    for (const [match, word] of Object.entries(TOPICS[topic].words)) {
      const re = new RegExp(' ' + match.replace(/'/g, "'?") + ' ', 'g');
      let m;
      while ((m = re.exec(t))) {
        const before = t.slice(0, m.index + 1);
        const negated = NEGATORS.test(before);
        if (!negated) return { topic, word };
        if (topic === 'happy') return { topic: 'sad', word: 'down' };   // "I'm not happy" / "not great"
        re.lastIndex = m.index + 1;
      }
    }
  }
  return null;
}
