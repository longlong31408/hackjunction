import { describe, it, expect, beforeEach } from 'vitest';
import { detectTopic } from '../src/brain/topics.js';
import { update, state, resetState } from '../src/brain/state.js';
import { pickLine, allLines } from '../src/brain/dialogue.js';

// What the cat says back after the talk loop (mirrors hear() in main.js).
function reply(text, valence) {
  const found = detectTopic(text);
  update({ text, valence, topic: found?.topic });
  return (found && pickLine('reply', state, 'cat', found.topic, { word: found.word })) || pickLine('reply', state, 'cat');
}
const CHEERFUL = /zoomies|yay|so happy for you|best thing|purring so loud|explore!/i;

describe('topics', () => {
  it('hears what the person is talking about', () => {
    expect(detectTopic("I'm really tired")).toEqual({ topic: 'tired', word: 'tired' });
    expect(detectTopic('I was so exhausted after work')).toEqual({ topic: 'tired', word: 'exhausted' });
    expect(detectTopic('I feel lonely tonight').topic).toBe('lonely');
    expect(detectTopic("I'm so stressed about everything").topic).toBe('stressed');
    expect(detectTopic('I had a really good day').topic).toBe('happy');
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

describe('empathy', () => {
  beforeEach(() => resetState());

  for (const [text, valence] of [["I'm really tired", -0.99], ['I was really tired', 0.6], ["I'm really tired", null]]) {
    it(`"${text}" (sentiment ${valence}) gets a caring, tiredness-aware reply`, () => {
      for (let i = 0; i < 10; i++) {
        resetState();
        const line = reply(text, valence);
        expect(line.tag).toBe('tired');
        expect(line.text).not.toMatch(CHEERFUL);
        expect(line.text).not.toContain('{word}');
        expect(state.mood).not.toMatch(/light|bright/);
        expect(state.energy).toBeLessThanOrEqual(2);
        expect(state.need).toBe('rest');
      }
    });
  }

  it('echoes the person\'s own feeling word', () => {
    const texts = new Set();
    for (let i = 0; i < 30; i++) { resetState(); texts.add(reply('I feel so exhausted', -0.9).text); }
    expect([...texts].some((t) => t.includes('exhausted'))).toBe(true);
  });

  it('sad, lonely and stressed never get jokes or cheering', () => {
    for (const text of ['I feel so sad today', 'I am really lonely', "I'm overwhelmed with everything"]) {
      for (let i = 0; i < 10; i++) { resetState(); expect(reply(text, 0.5).text).not.toMatch(CHEERFUL); }
    }
  });

  it('every topic has at least 4 replies and every {word} line has a topic', () => {
    for (const topic of ['tired', 'sad', 'lonely', 'stressed', 'angry', 'bored', 'happy']) {
      expect(allLines().filter((l) => l.context === 'reply' && l.tag === topic).length).toBeGreaterThanOrEqual(4);
    }
    for (const l of allLines()) if (l.text.includes('{word}')) expect(l.tag).toBeTruthy();
  });

  it('heavy topics offer a gentle next step, not a game', () => {
    for (const topic of ['tired', 'sad', 'lonely', 'stressed']) {
      const offers = allLines().filter((l) => l.tag === topic && l.choices).flatMap((l) => l.choices.map((c) => c.effect));
      expect(offers.some((e) => /rest|talk|breathe|worry|go:meadow|go:beach/.test(e))).toBe(true);
    }
  });
});
