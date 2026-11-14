import { describe, it, expect, beforeEach } from 'vitest';
import { detectTopic } from '../src/brain/topics.js';
import { update, state, resetState } from '../src/brain/state.js';

describe('topics', () => {
  it('hears what the person is talking about', () => {
    expect(detectTopic("I'm really tired")).toEqual({ topic: 'tired', word: 'tired' });
    expect(detectTopic('I was so exhausted after work')).toEqual({ topic: 'tired', word: 'exhausted' });
    expect(detectTopic('I feel lonely tonight').topic).toBe('lonely');
    expect(detectTopic("I'm so stressed about everything").topic).toBe('stressed');
    expect(detectTopic('I had a really good day').topic).toBe('happy');
    expect(detectTopic('my grandma passed away').topic).toBe('grief');
    expect(detectTopic('I feel so guilty').topic).toBe('shame');
  });
  it('understands negation', () => {
    expect(detectTopic("I'm not tired at all")).toBeNull();
    expect(detectTopic("I'm not happy")).toEqual({ topic: 'sad', word: 'down' });
    expect(detectTopic("honestly I'm not great")).toEqual({ topic: 'sad', word: 'down' });
  });
  it('does not misfire on ordinary sentences', () => {
    expect(detectTopic('I sat down for lunch')).toBeNull();
    expect(detectTopic('my exam went great')?.topic).toBe('happy');
  });
});

describe('words outrank the sentiment model', () => {
  beforeEach(() => resetState());
  for (const [text, valence] of [["I'm really tired", -0.99], ['I was really tired', 0.6], ["I'm really tired", null]]) {
    it(`"${text}" (sentiment ${valence}) is never read as cheerful`, () => {
      update({ text, valence, topic: detectTopic(text).topic });
      expect(state.mood).not.toMatch(/light|bright/);
      expect(state.energy).toBeLessThanOrEqual(2);
      expect(state.need).toBe('rest');
    });
  }
});
