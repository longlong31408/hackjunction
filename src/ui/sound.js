// Purr, meows, a soft lo-fi loop and a gentle UI pop — synthesised with Web Audio
// (original, no sound files to license). Every sound can be muted in ⚙️ Settings.
let ctx = null, master = null, music = null, sfxOn = true;
const noiseCache = {};

/** Must be called from a tap (browsers block audio until the first user gesture). */
export function initSound() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

function noise(kind) {
  if (noiseCache[kind]) return noiseCache[kind];
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  return (noiseCache[kind] = buf);
}
const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };

function tone(f0, f1, dur, vol, type = 'sine', delay = 0, out = master) {
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = gain(0);
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
}
function burst(freq, type, dur, vol, delay = 0) {
  const t = ctx.currentTime + delay, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = gain(0);
  src.buffer = noise('white'); f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
}

export function play(kind) {
  if (!ctx || !sfxOn) return;
  const t = ctx.currentTime;
  switch (kind) {
    case 'pop': tone(520, 860, 0.09, 0.12); break;
    case 'meow': {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = gain(0);
      o.type = 'sawtooth'; f.type = 'bandpass'; f.Q.value = 3;
      o.frequency.setValueAtTime(480, t); o.frequency.linearRampToValueAtTime(760, t + 0.12); o.frequency.linearRampToValueAtTime(430, t + 0.42);
      f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1500, t + 0.15); f.frequency.linearRampToValueAtTime(800, t + 0.42);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.5); break;
    }
    case 'purr': {   // brown-noise rumble, amplitude-modulated at ~24 Hz
      const src = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), am = gain(0.5), lfo = ctx.createOscillator(), d = gain(0.5), env = gain(0);
      src.buffer = noise('brown'); src.loop = true; lp.type = 'lowpass'; lp.frequency.value = 220; lfo.frequency.value = 24;
      lfo.connect(d); d.connect(am.gain); src.connect(lp); lp.connect(am); am.connect(env); env.connect(master);
      env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(1.4, t + 0.3); env.gain.linearRampToValueAtTime(0, t + 1.8);
      src.start(t); lfo.start(t); src.stop(t + 2); lfo.stop(t + 2); break;
    }
    case 'chomp': burst(500, 'lowpass', 0.07, 0.5); burst(450, 'lowpass', 0.07, 0.5, 0.15); burst(480, 'lowpass', 0.07, 0.4, 0.3); break;
    case 'sparkle': tone(1320, 1320, 0.25, 0.06); tone(1760, 1760, 0.3, 0.05, 'sine', 0.08); tone(2093, 2093, 0.4, 0.04, 'sine', 0.16); break;
    default: break;
  }
}

/** Soft lo-fi loop: Cmaj7 – Am7 – Fmaj7 – G6, gentle plucks and a little vinyl crackle. */
export function setMusic(on) {
  if (!ctx) return;
  if (on && !music) {
    const out = gain(0), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.connect(out); out.connect(master);
    out.gain.setTargetAtTime(0.5, ctx.currentTime, 1);
    const chords = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 52, 59]], penta = [72, 74, 76, 79, 81, 84];
    const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
    let bar = 0;
    const barLen = 4.2;
    const schedule = () => {
      chords[bar % 4].forEach((n) => tone(midi(n), midi(n), barLen + 0.6, 0.035, 'triangle', 0.1, lp));
      for (let b = 0; b < 4; b++) {
        if (Math.random() < 0.45) { const f = midi(penta[Math.floor(Math.random() * penta.length)]); tone(f, f, 1.4, 0.045, 'sine', 0.15 + b * (barLen / 4), lp); }
      }
      bar++;
    };
    schedule();
    const iv = setInterval(schedule, barLen * 1000);
    music = { out, stop() { clearInterval(iv); out.gain.setTargetAtTime(0, ctx.currentTime, 0.4); setTimeout(() => out.disconnect(), 2000); } };
  } else if (!on && music) { music.stop(); music = null; }
}

export function setSfx(on) { sfxOn = on; }
export const musicOn = () => !!music;

// Pause everything when the app is hidden (battery) and resume after.
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend().catch(() => {}); else ctx.resume().catch(() => {});
});
