import { describe, it, expect, beforeEach } from 'vitest';
import { understand } from '../src/brain/understand.js';
import { respond, resetMemory, memory, summaryAnswer, afterAnswer } from '../src/brain/conversation.js';
import { rank } from '../src/brain/coach.js';
import { update, state, resetState } from '../src/brain/state.js';

const CHEERFUL = /zoomies|yay|so happy for you|best thing|purring so loud|explore!/i;
const FORBIDDEN = /you should|cheer up|everything will be (fine|okay)|\bat least\b/i;

// One turn of the talk loop (mirrors hear() in main.js, after the safety check).
function turn(text, valence = null) {
  const a = understand(text);
  update({ text, valence, topic: a.topic });
  return respond(text, state, a);
}
const isQuestion = (line) => line.text.trim().endsWith('?') && !(line.choices || []).some((c) => c.effect.startsWith('act:'));

beforeEach(() => { resetState(); resetMemory(); });

describe('understanding', () => {
  it('notices feeling, life area, intensity, duration and effort', () => {
    const a = understand("I'm really exhausted, work has been crazy for weeks but I still went in today");
    expect(a).toMatchObject({ topic: 'tired', word: 'exhausted', area: 'work', intense: true, lasting: true, effort: true });
  });
  it('recognises "I don\'t know" and thanks', () => {
    expect(understand("I don't know").idk).toBe(true);
    expect(understand('thank you').thanks).toBe(true);
  });
});

describe('a conversation', () => {
  it('"I\'m really tired": reflects it and offers rest instead of questions', () => {
    const r = turn("I'm really tired", 0.6);          // even when the sentiment model misreads it
    expect(state.energy).toBe(1);
    expect(r.text.toLowerCase()).toContain('tired');
    expect(r.text).not.toMatch(CHEERFUL);
    expect(r.choices.some((c) => /act:(rest|couch|winddown)/.test(c.effect))).toBe(true);
  });

  it('"I\'m tired": reflects the feeling and asks one gentle question', () => {
    const r = turn("I'm tired", 0.6);
    expect(state.energy).toBe(2);
    expect(r.text.toLowerCase()).toContain('tired');
    expect(r.text).not.toMatch(CHEERFUL);
    expect(r.text).not.toMatch(FORBIDDEN);
    expect(r.text.trim().endsWith('?')).toBe(true);
    expect(r.text.split(/(?<=[.?!])\s/).length).toBeLessThanOrEqual(5);
  });

  it('reflects the life area and validates by context', () => {
    turn("I'm so stressed");
    const r = turn("work is just too much and I'm stressed");
    expect(r.text).toMatch(/work/i);
  });

  it('never asks three questions in a row', () => {
    let inRow = 0;
    for (const text of ["I'm tired", 'I guess work', 'my boss', "it's just a lot", 'yeah', 'everything']) {
      const r = turn(text);
      inRow = isQuestion(r) ? inRow + 1 : 0;
      expect(inRow).toBeLessThanOrEqual(2);
    }
  });

  it('summarises after a few heavy turns, using only words it recognised', () => {
    turn("I'm so exhausted");
    turn('school has been a lot and I am stressed');
    const r = turn("and I'm really lonely lately");
    expect(r.choices.map((c) => c.effect)).toContain('summary_yes');
    expect(r.text).toMatch(/school/);
    expect(r.text).toMatch(/exhausted|stressed|lonely/);
    expect(summaryAnswer(true, state).choices.some((c) => c.effect.startsWith('act:'))).toBe(true);
  });

  it('"I don\'t know" is accepted gently with a soft offer, not another question', () => {
    turn("I'm sad");
    const r = turn("I don't know");
    expect(r.text).toMatch(/okay|alright|don't have to/i);
    expect(r.choices.some((c) => c.effect.startsWith('act:'))).toBe(true);
    expect(r.choices.map((c) => c.effect)).toEqual(expect.arrayContaining(['more', 'talk']));
  });

  it('notices when a feeling comes back', () => {
    turn("I'm so tired");
    turn('work was awful today');
    const r = turn('I am just so tired');
    expect(r.text).toMatch(/earlier|second time/);
  });

  it('a very tired person is offered rest, not questioned', () => {
    turn("I'm exhausted, I can't get up");
    update({ text: 'no energy', valence: -0.8, topic: 'tired' });
    state.energy = 1;
    const r = respond("I'm so exhausted", state);
    expect(r.choices.some((c) => /act:(rest|couch|winddown|meadow)/.test(c.effect))).toBe(true);
  });

  it('low energy from earlier does not stop the cat from listening to something new', () => {
    turn("I'm really exhausted");
    const r = turn('my boss keeps adding more and I feel like a failure');
    expect(r.text.trim().endsWith('?')).toBe(true);
    expect(r.choices || []).not.toEqual(expect.arrayContaining([expect.objectContaining({ effect: 'act:couch' })]));
  });

  it('checks in after an activity and responds to how it went', () => {
    expect(afterAnswer('better', state).text.length).toBeGreaterThan(5);
    expect(afterAnswer('same', state).choices.some((c) => c.effect.startsWith('act:'))).toBe(true);
    expect(afterAnswer('worse', state).choices.map((c) => c.effect)).toContain('help:1');
  });

  it('no line in a whole conversation breaks the writing rules', () => {
    for (const text of ["I'm tired", 'my mom is sick', 'I feel guilty', 'I miss my grandma, she passed away', 'I am angry at my boss', "I'm bored", 'I had a great day']) {
      expect(turn(text).text).not.toMatch(FORBIDDEN);
    }
  });
});

describe('activity suggestions (coach)', () => {
  const base = { energy: 3, mood: 'low', need: 'company', night: false, done: new Set(), offered: new Map() };
  it('fit the person', () => {
    expect(rank({ ...base, topic: 'stressed', word: 'panicky' })[0]).toBe('ground');
    expect(['turtle', 'reach']).toContain(rank({ ...base, topic: 'lonely', word: 'lonely' })[0]);
    expect(['play', 'beach']).toContain(rank({ ...base, mood: 'neutral', topic: 'bored', word: 'bored' })[0]);
    expect(rank({ ...base, energy: 1, topic: 'tired', word: 'exhausted' })[0]).toBe('rest');
    expect(rank({ ...base, energy: 2, topic: 'tired', word: 'tired', night: true })[0]).toBe('winddown');
    expect(rank({ ...base, mood: 'bright', energy: 4, topic: 'happy', word: 'happy' }).slice(0, 2)).toEqual(expect.arrayContaining(['goodthing']));
  });
  it('never suggests playing to someone who is grieving or sad', () => {
    for (const topic of ['grief', 'sad', 'lonely', 'shame']) expect(rank({ ...base, topic }).slice(0, 3)).not.toContain('play');
  });
  it('does not repeat something already done', () => {
    const done = new Set(['rest']);
    expect(rank({ ...base, energy: 1, topic: 'tired', done })[0]).not.toBe('rest');
  });
});
