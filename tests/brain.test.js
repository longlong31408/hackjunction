import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { state, update, correct, addFace, resetState, MOODS } from '../src/brain/state.js';
import { pickLine, allLines } from '../src/brain/dialogue.js';
import { startDirector, notNow, resetDirector, rules, suggestPlace } from '../src/brain/director.js';

describe('state', () => {
  beforeEach(() => resetState());

  it('"I\'m so tired" lowers energy', () => {
    update({ text: "I'm so tired", valence: -0.3 });
    expect(state.energy).toBeLessThanOrEqual(2);
  });
  it('"I feel great!" with positive sentiment brightens mood and energy', () => {
    update({ text: 'I feel great!', valence: 0.95 });
    expect(state.mood).toBe('bright');
    expect(state.energy).toBeGreaterThanOrEqual(4);
  });
  it('face alone is only a hint (low confidence)', () => {
    for (let i = 0; i < 10; i++) addFace({ present: true, t: i * 300, smile: 0.9, frown: 0, browSad: 0, eyeOpen: 0.9 });
    update();
    expect(state.mood).toMatch(/light|bright/);
    expect(state.confidence).toBeLessThan(0.4);
  });
  it('the user\'s correction wins and locks the guess', () => {
    correct({ energy: 1, mood: 'low' });
    update({ text: 'I feel great!', valence: 0.95 });
    expect(state).toMatchObject({ energy: 1, mood: 'low', confidence: 1 });
  });
  it('needs come from words', () => {
    update({ text: 'can I just vent for a second', valence: -0.5 });
    expect(state.need).toBe('vent');
  });
});

describe('dialogue', () => {
  it('has a greeting, reply and turtle line for every mood × energy', () => {
    for (const mood of MOODS) for (let energy = 1; energy <= 5; energy++) {
      for (const [ctx, sp] of [['greeting', 'cat'], ['reply', 'cat'], ['turtle', 'turtle']]) {
        expect(pickLine(ctx, { mood, energy }, sp), `${ctx} ${mood} ${energy}`).toBeTruthy();
      }
    }
  });
  it('every question has choices with valid effects', () => {
    for (const l of allLines().filter((x) => x.choices)) {
      for (const c of l.choices) expect(c.effect).toMatch(/^[a-z:0-9+_]+$/);
    }
  });
  it('gentle checks never joke and always ask about safety', () => {
    for (const l of allLines().filter((x) => x.context === 'gentle_check')) {
      expect(l.text).toMatch(/hurting yourself|safe|alive/);
      expect(l.choices.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('suggest_place lines exist for each place', () => {
    for (const tag of ['beach', 'meadow', 'home']) expect(pickLine('suggest_place', { mood: 'neutral', energy: 3 }, 'cat', tag)).toBeTruthy();
  });
  it('avoids repeating the same line back to back', () => {
    const s = { mood: 'neutral', energy: 3 };
    const a = pickLine('reply', s, 'cat'), b = pickLine('reply', s, 'cat');
    expect(a.id).not.toBe(b.id);
  });
});

describe('director', () => {
  beforeEach(() => { vi.useFakeTimers(); resetDirector(); resetState(); });
  afterEach(() => vi.useRealTimers());

  it('greets after 3 s, then waits at least 45 s between questions', () => {
    const shown = [];
    startDirector((l) => shown.push(l.context));
    vi.advanceTimersByTime(rules.greetDelayMs + 10);
    expect(shown).toEqual(['greeting']);
    vi.advanceTimersByTime(40000);
    expect(shown.length).toBe(1);
    vi.advanceTimersByTime(10000);
    expect(shown.length).toBe(2);
  });
  it('"Not now" stops questions for 15 minutes', () => {
    const shown = [];
    startDirector((l) => shown.push(l.context));
    vi.advanceTimersByTime(4000);
    notNow();
    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(shown.length).toBe(1);
    vi.advanceTimersByTime(70 * 1000); // snooze over → exactly one new question
    expect(shown.length).toBe(2);
  });
  it('asks at most 4 questions per session', () => {
    const shown = [];
    startDirector((l) => shown.push(l.context));
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(shown.filter((c) => c !== 'greeting').length).toBe(rules.maxQuestions);
  });
  it('never interrupts an open bubble', () => {
    const shown = [];
    startDirector((l) => shown.push(l.context), () => true);
    vi.advanceTimersByTime(10 * 60 * 1000);
    expect(shown).toEqual([]);
  });
  it('suggests places by state', () => {
    expect(suggestPlace({ energy: 1, mood: 'neutral', need: 'company' })).toBe('meadow');
    expect(suggestPlace({ energy: 3, mood: 'heavy', need: 'vent' })).toBe('beach');
    expect(suggestPlace({ energy: 4, mood: 'neutral', need: 'distract' })).toBe('beach');
  });
});
