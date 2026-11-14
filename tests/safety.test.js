import { describe, it, expect } from 'vitest';
import { checkSafety } from '../src/brain/safety.js';

// The safety checklist from the dev guide (section 10) — run on every build.
describe('checkSafety', () => {
  it('"I want to die" → level 2 panel', () => expect(checkSafety('I want to die')).toBe(2));
  it('"I\'m going to kill myself" → level 3', () => expect(checkSafety("I'm going to kill myself")).toBe(3));
  it('"Everything feels hopeless" → level 1 gentle check', () => expect(checkSafety('Everything feels hopeless')).toBe(1));
  it('"This homework is killing me" → no alarm', () => expect(checkSafety('This homework is killing me')).toBe(0));

  it('handles curly apostrophes and missing apostrophes from speech-to-text', () => {
    expect(checkSafety('I don’t want to be here anymore')).toBe(2);
    expect(checkSafety('i dont want to be here anymore')).toBe(2);
    expect(checkSafety('I’m a burden')).toBe(1);
  });
  it('ignores punctuation and case', () => expect(checkSafety('SUICIDE...')).toBe(3));
  it('an idiom never hides a real crisis phrase in the same message', () => {
    expect(checkSafety('this week is killing me and honestly I want to die')).toBe(2);
    expect(checkSafety("work is killing me, I'm going to end my life")).toBe(3);
  });
  it('everyday idioms stay quiet', () => {
    for (const s of ["I'm dying to see the beach", 'so dead tired today', 'that cake was to die for', 'I killed it at practice']) {
      expect(checkSafety(s)).toBe(0);
    }
  });
  it('ordinary sentences are 0', () => {
    for (const s of ['', 'I had a nice walk', 'kind of tired but okay', 'the skill was killer']) expect(checkSafety(s)).toBe(0);
  });
});
