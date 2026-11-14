# 🐱 Mochi — App Development Guide

Development instructions for **Mochi**: a cat-companion web app (PWA) for iOS and Android. The cat reads the user's facial expressions (camera) and speech (microphone) on-device, starts conversations, mirrors the user's energy, leads them to calm places on a scrollable map, and always offers help resources. All processing happens on the device; no user data is sent anywhere.

---

## Table of contents

1. [Scope](#1-scope)
2. [Tech stack](#2-tech-stack)
3. [Setup](#3-setup)
4. [Project structure](#4-project-structure)
5. [How the app works (architecture)](#5-how-the-app-works-architecture)
6. [Build steps with code](#6-build-steps-with-code)
7. [Content: dialogue, tasks, helplines](#7-content-dialogue-tasks-helplines)
8. [Safety rules (non-negotiable)](#8-safety-rules-non-negotiable)
9. [Art & sound](#9-art--sound)
10. [Testing checklist](#10-testing-checklist)

---

## 1. Scope

### ✅ Must have

| # | Feature | Done when… |
|---|---|---|
| M1 | **Onboarding** (1–2 screens) | Explains AI + camera/mic + "nothing leaves your phone"; 18+ confirm; name your cat |
| M2 | **Cozy home room** with the cat | Cat shows **5 energy looks** (sleepy → zoomy) |
| M3 | **Face sensing** (camera) | Smile / frown / sad-brows / eye-openness numbers update ~3×/sec |
| M4 | **Talk to the cat** (tap-to-talk) | Speech → text on-device → cat replies with a fitting scripted line |
| M5 | **Mood state** | Face + words combine into `energy (1–5)` and `mood`; cat mirrors energy |
| M6 | **Cat asks first** | On open, cat greets based on state; asks to confirm its guess; "Not now" works |
| M7 | **Small world map** (bigger than the screen) | Cat can **lead** you ("Follow me") to the beach or meadow; camera follows |
| M8 | **One NPC: Old Turtle** at the beach | Says different lines depending on your mood |
| M9 | **Safety** | 🛟 button on every screen; crisis phrases → calm help panel with verified helplines |
| M10 | **Privacy controls** | Camera/mic indicator, ⏸️ pause, "delete my data" |
| M11 | **Works on iOS & Android** | Runs in Safari (iPhone) and Chrome (Android), installable to home screen |

### 🟡 Should have

- **Breathing exercise** in the Sleepy Meadow (expanding circle, 1 minute)
- **Worry-eating cat**: say a worry → cat eats it (animation), nothing stored
- **3 easy daily tasks** sized to energy ("drink a glass of water with me") — skipping is always fine
- **Offline after first load** (PWA caching)
- Day/night tint based on local time
- Voice loudness as an extra signal

### ⚪ Could have

- Always-listening mode (instead of tap-to-talk)
- Cloud Sheep NPC in the meadow
- Couch mode (cat wanders by itself)
- Cat accessories / decorating

### ❌ Out of scope

Large open world, native apps, AI language-model chat, multiple languages, user data collection.

---

## 2. Tech stack

We build a **web app (PWA)** that runs in the phone's browser and can be installed to the home screen. This gives **iOS + Android from one codebase**, no app store, no Mac needed, and instant deploys.

> The app is written in JavaScript (browsers only run JavaScript). Python is used only for the content build script (`scripts/build_dialogue.py`).

| Need | Tool | Why |
|---|---|---|
| Build tool / dev server | **Vite** (vanilla JS) | One command to start, fast reload |
| 2D game (rooms, map, cat, camera follow) | **Phaser 3** | Beginner-friendly HTML5 game framework; tons of examples |
| Buttons, bubbles, panels | **Plain HTML + CSS** overlay | Much easier than building UI inside the game engine |
| Face expressions | **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`) | Runs in the browser; gives **face blendshape scores** (smile, frown, blink…) |
| Speech-to-text | **Transformers.js** + `Xenova/whisper-tiny.en` | Whisper running **in the browser**, no server |
| Feeling from words | **Transformers.js** sentiment model + keyword lists | Positive/negative score + simple rules |
| Offline + installable | **vite-plugin-pwa** | Manifest + service worker caching |
| Hosting (HTTPS needed for camera/mic) | **Netlify** or **GitHub Pages** | Free, HTTPS, deploy in a minute |
| Content tooling | **Python** script | CSV dialogue → JSON |

---

## 3. Setup

### Requirements

- **Node.js 20+** and npm (everyone)
- **Python 3.10+** (content person)
- Git + a shared GitHub repo
- At least **one iPhone and one Android phone** for testing

### Create the project

```bash
npm create vite@latest mochi -- --template vanilla
cd mochi
npm install
npm install phaser@3 @mediapipe/tasks-vision @huggingface/transformers
npm install -D vite-plugin-pwa
npm run dev
```

Open the printed `localhost` URL on your laptop — `localhost` is allowed to use the camera.

### Testing on phones (HTTPS required)

Phones need **HTTPS** to allow camera and microphone. Easiest:

```bash
npm run build
npx netlify-cli deploy --dir=dist        # preview URL
npx netlify-cli deploy --dir=dist --prod # final URL
```

> Deploy a minimal build early and test camera + mic on both phones before building features.

### `vite.config.js`

```js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Mochi',
        short_name: 'Mochi',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF6E9',
        theme_color: '#FFC8A2',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json,mp3,wasm}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        // Cache AI model files the first time they're downloaded → works offline afterwards
        runtimeCaching: [{
          urlPattern: ({ url }) =>
            /huggingface\.co|hf\.co|jsdelivr\.net|storage\.googleapis\.com/.test(url.hostname),
          handler: 'CacheFirst',
          options: {
            cacheName: 'ai-models',
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
});
```

**Privacy note:** the only network traffic is the **one-time download of the app and AI model files**. Camera images, audio and text are never sent anywhere.

---

## 4. Project structure

```
mochi/
├── index.html                 # canvas + HTML overlay (HUD, bubbles, panels)
├── vite.config.js
├── public/
│   ├── icons/                 # app icons (192, 512)
│   ├── art/                   # cat poses, room, world map, turtle
│   └── audio/                 # purr, meow, soft music
├── src/
│   ├── main.js                # starts Phaser + wires everything together
│   ├── style.css
│   ├── scenes/
│   │   ├── HomeScene.js       # cozy room with the cat
│   │   └── WorldScene.js      # big map: beach + meadow, camera follows cat
│   ├── sensing/
│   │   ├── face.js            # MediaPipe → face signals
│   │   ├── mic.js             # record audio + loudness
│   │   └── aiWorker.js        # Whisper + sentiment in a Web Worker
│   ├── brain/
│   │   ├── state.js           # combines signals → energy / mood / need
│   │   ├── safety.js          # crisis phrase check (runs first, always)
│   │   ├── dialogue.js        # picks lines by context + state
│   │   └── director.js        # decides when the cat speaks first
│   ├── ui/
│   │   └── hud.js             # top bar, bottom bar, bubbles, help panel
│   ├── data/
│   │   ├── dialogue.json      # generated from content/dialogue.csv
│   │   ├── tasks.json
│   │   ├── helplines.json
│   │   └── crisis_phrases.json
│   └── storage.js             # tiny localStorage wrapper + delete-all
├── content/
│   └── dialogue.csv           # writers edit this (spreadsheet-friendly)
└── scripts/
    └── build_dialogue.py      # CSV → src/data/dialogue.json
```

---

## 5. How the app works (architecture)

```
 Camera ──► face.js (MediaPipe, ~3×/s) ──► face signals ─┐
                                                         │
 Mic ─────► mic.js (tap-to-talk) ──► aiWorker.js         │
                                     ├─ Whisper → text ──┼──► safety.js ──(risk)──► Help panel
                                     └─ sentiment ───────┤        │
                                                         ▼        ▼ (ok)
                                                   state.js → { energy, mood, need, confidence }
                                                         │
                                                         ▼
                                              director.js (every 3 s: should the cat act?)
                                                         │
                                                         ▼
                                              dialogue.js → HUD bubble + cat animation
                                                         │
                                                         ▼
                                       HomeScene / WorldScene (cat mirrors energy, leads to places)
```

**Golden rules**
1. **Safety check runs on every piece of text before anything else.**
2. Camera/mic data is **processed in memory and thrown away** — never stored, never sent.
3. Face = **hint**, words = **stronger signal**, user's own answer = **truth**. The cat **confirms before assuming**.

---

## 6. Build steps with code

### Step 1 — Page skeleton (`index.html`)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Mochi</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>
  <div id="game"></div>

  <!-- HUD overlay -->
  <header id="topbar">
    <span id="catName">Mochi</span>
    <span id="senses">📷🎙️</span>
    <button id="pauseBtn" aria-label="Pause camera and mic">⏸️</button>
    <button id="helpBtn" aria-label="Get help">🛟</button>
  </header>

  <div id="bubble" hidden>
    <p id="bubbleText"></p>
    <div id="bubbleChoices"></div>
  </div>

  <nav id="bottombar">
    <button id="homeBtn">🏠</button>
    <button id="mapBtn">🗺️</button>
    <button id="talkBtn">🎙️ Talk</button>
    <button id="tasksBtn">🧶</button>
  </nav>

  <section id="helpPanel" hidden></section>
  <section id="onboarding"></section>

  <video id="cam" playsinline muted hidden></video>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Step 2 — Face sensing (`src/sensing/face.js`)

```js
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

// Use the SAME version as installed: run `npm ls @mediapipe/tasks-vision`
const MP_VERSION = 'PUT_INSTALLED_VERSION_HERE';
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export async function startFace(videoEl, onSample) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: 320, height: 240 }, audio: false,
  });
  videoEl.srcObject = stream;
  await videoEl.play();

  const vision = await FilesetResolver.forVisionTasks(WASM);
  const landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: true,
  });

  let stopped = false, last = 0;
  const loop = () => {
    if (stopped) return;
    const now = performance.now();
    if (now - last > 333 && videoEl.readyState >= 2) {       // ~3 times per second
      last = now;
      const res = landmarker.detectForVideo(videoEl, now);
      const cats = res.faceBlendshapes?.[0]?.categories;
      if (!cats) {
        onSample({ present: false, t: now });
      } else {
        const b = Object.fromEntries(cats.map(c => [c.categoryName, c.score]));
        onSample({
          present: true, t: now,
          smile:   (b.mouthSmileLeft + b.mouthSmileRight) / 2,
          frown:   (b.mouthFrownLeft + b.mouthFrownRight) / 2,
          browSad: b.browInnerUp,
          eyeOpen: 1 - (b.eyeBlinkLeft + b.eyeBlinkRight) / 2,
        });
      }
    }
    requestAnimationFrame(loop);
  };
  loop();

  // Returns a stop function (used by ⏸️ and when the app goes to background)
  return () => { stopped = true; stream.getTracks().forEach(t => t.stop()); };
}
```

> ✅ **Check:** show the four numbers live on screen. Smile at the phone → `smile` goes up.

### Step 3 — AI worker: speech-to-text + sentiment (`src/sensing/aiWorker.js`)

Running AI in a **Web Worker** keeps the game smooth.

```js
import { pipeline } from '@huggingface/transformers';

let asr, sentiment;

self.onmessage = async ({ data }) => {
  if (data.type === 'load') {
    asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
    sentiment = await pipeline('sentiment-analysis',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
    self.postMessage({ type: 'ready' });
  }

  if (data.type === 'transcribe') {
    const { text } = await asr(data.audio);           // Float32Array, 16 kHz mono
    const [s] = await sentiment(text || ' ');
    const valence = s.label === 'POSITIVE' ? s.score : -s.score; // -1 … +1
    self.postMessage({ type: 'result', text: text.trim(), valence });
  }
};
```

Create it from `main.js`:

```js
const ai = new Worker(new URL('./sensing/aiWorker.js', import.meta.url), { type: 'module' });
ai.postMessage({ type: 'load' });
```

Show a cute "Mochi is waking up…" loader until `ready` arrives (first load downloads the models; afterwards they come from cache).

### Step 4 — Microphone (`src/sensing/mic.js`)

```js
let stream, recorder, chunks = [], analyser, levels = [];

export async function initMic() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  analyser = ctx.createAnalyser();
  ctx.createMediaStreamSource(stream).connect(analyser);
}

export function startRecording() {
  chunks = []; levels = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.start();
  const buf = new Float32Array(analyser.fftSize);
  const t = setInterval(() => {                       // loudness samples
    if (recorder.state !== 'recording') return clearInterval(t);
    analyser.getFloatTimeDomainData(buf);
    levels.push(Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length));
  }, 100);
}

export function stopRecording() {
  return new Promise(resolve => {
    recorder.onstop = async () => {
      const blob = new Blob(chunks);
      const ctx16 = new AudioContext({ sampleRate: 16000 });   // Whisper needs 16 kHz
      const decoded = await ctx16.decodeAudioData(await blob.arrayBuffer());
      const audio = decoded.getChannelData(0);
      const loudness = levels.reduce((a, b) => a + b, 0) / Math.max(levels.length, 1);
      resolve({ audio, loudness, seconds: decoded.duration });
    };
    recorder.stop();
  });
}

export function stopMic() { stream?.getTracks().forEach(t => t.stop()); }
```

The **🎙️ Talk** button: press → `startRecording()`; release → `stopRecording()` → send `audio` to the worker. The audio buffer is discarded after transcription.

### Step 5 — Safety check (`src/brain/safety.js`)

```js
import phrases from '../data/crisis_phrases.json';

const norm = s => ' ' + s.toLowerCase().replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ') + ' ';

// Returns 0 none · 1 concern · 2 high · 3 urgent
export function checkSafety(text) {
  const t = norm(text);
  if (phrases.ignore.some(p => t.includes(norm(p)))) {
    // known idioms like "this homework is killing me" → at most a gentle check
    return phrases.urgent.some(p => t.includes(norm(p))) ? 3 : 0;
  }
  if (phrases.urgent.some(p => t.includes(norm(p))))  return 3;
  if (phrases.high.some(p => t.includes(norm(p))))    return 2;
  if (phrases.concern.some(p => t.includes(norm(p)))) return 1;
  return 0;
}
```

`src/data/crisis_phrases.json` (starter list — expand and test it):

```json
{
  "urgent":  ["kill myself", "end my life", "going to end it", "take my own life", "suicide"],
  "high":    ["want to die", "wish i was dead", "wish i wouldn't wake up", "hurt myself",
              "don't want to be here anymore", "can't go on"],
  "concern": ["what's the point", "no point", "hopeless", "better off without me",
              "i'm a burden", "worthless", "hate myself", "nobody cares"],
  "ignore":  ["killing me", "dying to", "dead tired", "to die for"]
}
```

### Step 6 — Mood state (`src/brain/state.js`)

```js
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
let faceWindow = [];               // last 10 seconds of face samples
let lock = null;                   // user corrections win for 30 minutes

export const state = { energy: 3, mood: 'neutral', need: 'company', confidence: 0.2 };

export function addFace(sample) {
  faceWindow.push(sample);
  faceWindow = faceWindow.filter(s => sample.t - s.t < 10000);
}

const WORDS = {
  energyLow:  ['tired', 'exhausted', 'sleepy', "can't get up", 'drained', 'no energy'],
  energyHigh: ['energetic', "let's go", 'excited', 'pumped'],
  needVent:   ['talk', 'listen', 'vent', 'tell you'],
  needDistract: ['bored', 'distract', 'something fun'],
  needRest:   ['rest', 'sleep', 'nap'],
};
const has = (text, list) => list.some(w => text.toLowerCase().includes(w));

// Call with whatever is available: { text, valence, loudness }
export function update({ text, valence, loudness } = {}) {
  if (lock && Date.now() < lock.until) return state;

  let energyVotes = [], moodVotes = [];         // [value, weight]
  const faces = faceWindow.filter(s => s.present);

  if (faces.length >= 5) {                       // FACE — weight 0.3
    const avg = k => faces.reduce((a, s) => a + s[k], 0) / faces.length;
    energyVotes.push([1 + 4 * clamp(avg('eyeOpen') * 0.7 + avg('smile') * 0.3, 0, 1), 0.3]);
    moodVotes.push([clamp(avg('smile') - avg('frown') - 0.5 * avg('browSad'), -1, 1), 0.3]);
  }
  if (loudness != null) {                         // VOICE — weight 0.4 (tune by testing!)
    energyVotes.push([1 + 4 * clamp(loudness * 8, 0, 1), 0.4]);
  }
  if (text) {                                     // WORDS — weight 0.7
    if (valence != null) moodVotes.push([valence, 0.7]);
    if (has(text, WORDS.energyLow))  energyVotes.push([1.5, 0.7]);
    if (has(text, WORDS.energyHigh)) energyVotes.push([4.5, 0.7]);
    state.need = has(text, WORDS.needVent) ? 'vent'
               : has(text, WORDS.needDistract) ? 'distract'
               : has(text, WORDS.needRest) ? 'rest' : state.need;
  }

  const wavg = v => v.reduce((a, [x, w]) => a + x * w, 0) / v.reduce((a, [, w]) => a + w, 0);
  if (energyVotes.length) state.energy = Math.round(clamp(wavg(energyVotes), 1, 5));
  if (moodVotes.length) {
    const m = wavg(moodVotes);
    state.mood = m < -0.6 ? 'heavy' : m < -0.2 ? 'low' : m < 0.2 ? 'neutral' : m < 0.6 ? 'light' : 'bright';
  }
  const totalWeight = [...energyVotes, ...moodVotes].reduce((a, [, w]) => a + w, 0);
  state.confidence = clamp(totalWeight / 2, 0, 1);

  if (!text) state.need = state.energy <= 2 ? 'rest' : state.energy >= 4 ? 'distract' : 'company';
  return state;
}

// When the user answers "No, I'm just sad" etc.
export function correct(fields) {
  Object.assign(state, fields, { confidence: 1 });
  lock = { until: Date.now() + 30 * 60 * 1000 };
}
```

> 🔧 Build a hidden **debug panel** (triple-tap the cat name) with sliders for energy/mood — needed for testing.

### Step 7 — Dialogue (`src/brain/dialogue.js`)

```js
import lines from '../data/dialogue.json';
const recent = new Set();

// context: 'greeting' | 'confirm' | 'reply' | 'suggest_place' | 'task' | 'turtle' | ...
export function pickLine(context, state, speaker = 'cat') {
  const fits = lines.filter(l =>
    l.speaker === speaker &&
    l.context === context &&
    (!l.mood || l.mood.includes(state.mood)) &&
    (!l.energy || (state.energy >= l.energy[0] && state.energy <= l.energy[1])));
  const fresh = fits.filter(l => !recent.has(l.id));
  const pool = fresh.length ? fresh : fits;
  const line = pool[Math.floor(Math.random() * pool.length)];
  if (!line) return null;
  recent.add(line.id);
  return line;   // { id, text, anim, choices? }
}
```

### Step 8 — The cat speaks first (`src/brain/director.js`)

```js
import { state } from './state.js';
import { pickLine } from './dialogue.js';

const rules = { minGapMs: 45000, maxQuestions: 4 };
let lastAsk = 0, asked = 0, snoozeUntil = 0, quiet = false;

export function startDirector(showBubble) {
  // Greet right after opening
  setTimeout(() => say('greeting'), 3000);

  setInterval(() => {
    const now = Date.now();
    if (quiet || now < snoozeUntil || asked >= rules.maxQuestions) return;
    if (now - lastAsk < rules.minGapMs) return;

    if (state.confidence >= 0.4 && state.confidence < 0.75) say('confirm');        // "You look sleepy… am I right?"
    else if (state.confidence < 0.4) say('indirect');                                // "Which blanket today?"
    else say('suggest_place');                                                       // "Want to see the beach?"
  }, 3000);

  function say(context) {
    const line = pickLine(context, state);
    if (!line) return;
    lastAsk = Date.now(); asked++;
    showBubble(line);
  }
}

export function notNow() { snoozeUntil = Date.now() + 15 * 60 * 1000; }
export function setQuiet(q) { quiet = q; }
```

Every bubble with a question **always** has a **"Not now"** choice wired to `notNow()`.

### Step 9 — Game scenes (Phaser)

`src/main.js` (core setup):

```js
import Phaser from 'phaser';
import HomeScene from './scenes/HomeScene.js';
import WorldScene from './scenes/WorldScene.js';

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#FFF6E9',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 720, height: 1280 },
  scene: [HomeScene, WorldScene],
});
```

`src/scenes/HomeScene.js`:

```js
import Phaser from 'phaser';

export default class HomeScene extends Phaser.Scene {
  constructor() { super('Home'); }

  preload() {
    this.load.image('room', 'art/room.png');
    for (let e = 1; e <= 5; e++) this.load.image(`cat${e}`, `art/cat_energy${e}.png`);
  }

  create() {
    this.add.image(360, 640, 'room');
    this.cat = this.add.image(360, 900, 'cat3').setInteractive();
    this.tweens.add({ targets: this.cat, scaleY: 0.97, yoyo: true, repeat: -1, duration: 1200 }); // breathing idle
    this.cat.on('pointerdown', () => this.events.emit('catTapped'));
  }

  setEnergy(e) { this.cat.setTexture(`cat${e}`); }
}
```

> 🐾 **Placeholder trick:** until art is ready, use a big emoji: `this.add.text(360, 900, '🐱', { fontSize: '200px' })`. Swap to images later.

`src/scenes/WorldScene.js` — a **map bigger than the screen**, camera follows the cat:

```js
import Phaser from 'phaser';

const PLACES = {
  beach:  { x: 400,  y: 2600, label: 'Bottle Beach' },
  meadow: { x: 1300, y: 900,  label: 'Sleepy Meadow' },
  home:   { x: 900,  y: 1700, label: 'Home' },
};

export default class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  preload() {
    this.load.image('map', 'art/world_map.png');   // one big painted image, e.g. 1800 × 3200
    this.load.image('catWalk', 'art/cat_energy3.png');
    this.load.image('turtle', 'art/turtle.png');
  }

  create() {
    this.add.image(0, 0, 'map').setOrigin(0);
    this.cameras.main.setBounds(0, 0, 1800, 3200);
    this.turtle = this.add.image(PLACES.beach.x + 150, PLACES.beach.y, 'turtle');
    this.cat = this.add.image(PLACES.home.x, PLACES.home.y, 'catWalk');
    this.cameras.main.startFollow(this.cat, true, 0.08, 0.08);

    // Tap anywhere → cat walks there
    this.input.on('pointerdown', p => this.walkTo(p.worldX, p.worldY));
  }

  walkTo(x, y, onArrive) {
    const dist = Phaser.Math.Distance.Between(this.cat.x, this.cat.y, x, y);
    this.tweens.killTweensOf(this.cat);
    this.tweens.add({ targets: this.cat, x, y, duration: dist * 4, ease: 'Sine.inOut',
                      onComplete: () => onArrive?.() });
  }

  // "Follow me" — the cat leads, the camera follows
  leadTo(placeKey, onArrive) {
    const p = PLACES[placeKey];
    this.walkTo(p.x, p.y, onArrive);
  }
}
```

**Which place does the cat suggest?**

| State | Suggests | Then |
|---|---|---|
| energy ≤ 2 or need = rest | 🌾 Sleepy Meadow | breathing exercise |
| mood low/heavy, need = vent | 🏖️ Bottle Beach | Old Turtle listens |
| need = distract, energy ≥ 3 | 🏖️ Bottle Beach | collect shells / wave watching |
| mood light/bright | anywhere | celebrate, explore |

### Step 10 — The talk loop (wire it all in `main.js`)

```js
import { startRecording, stopRecording } from './sensing/mic.js';
import { checkSafety } from './brain/safety.js';
import { update, state } from './brain/state.js';
import { pickLine } from './brain/dialogue.js';
import { showBubble, showHelp, catThinking } from './ui/hud.js';

talkBtn.addEventListener('pointerdown', () => startRecording());
talkBtn.addEventListener('pointerup', async () => {
  catThinking();                                       // instant reaction (< 0.3 s)
  const { audio, loudness } = await stopRecording();
  ai.postMessage({ type: 'transcribe', audio }, [audio.buffer]);
  ai.onmessage = ({ data }) => {
    if (data.type !== 'result') return;
    const risk = checkSafety(data.text);               // ALWAYS FIRST
    if (risk >= 2) return showHelp(risk);
    update({ text: data.text, valence: data.valence, loudness });
    const line = pickLine(risk === 1 ? 'gentle_check' : 'reply', state);
    showBubble(line);
    game.scene.getScene('Home')?.setEnergy(state.energy);
  };
});
```

Also add a **⌨️ type instead** option (for users without a mic, or in public).

### Step 11 — Privacy controls (`src/storage.js` + HUD)

```js
const KEY = 'mochi';
export const load = () => JSON.parse(localStorage.getItem(KEY) || '{}');
export const save = obj => localStorage.setItem(KEY, JSON.stringify({ ...load(), ...obj }));
export function deleteAll() { localStorage.removeItem(KEY); location.reload(); }
```

- Store **only**: cat name, settings, last energy/mood. **Never** store audio, images or transcripts.
- **⏸️** calls the stop functions for camera and mic; the 📷🎙️ indicator turns grey.
- Stop sensing when the app is hidden:
  ```js
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseSenses(); });
  ```
- Settings → **"Delete my data"** → `deleteAll()`.

### Step 12 — Make it installable & offline

1. Add `public/icons/icon-192.png` and `icon-512.png` (a cute cat face).
2. `npm run build` → deploy.
3. **Android (Chrome):** menu → *Install app*. **iPhone (Safari):** Share → *Add to Home Screen*.
4. Open once online (models download + cache), then test in **airplane mode**.

---

## 7. Content: dialogue, tasks, helplines

### Writing dialogue in a spreadsheet

Writers edit `content/dialogue.csv`:

| id | speaker | context | mood | energy_min | energy_max | text | anim |
|---|---|---|---|---|---|---|---|
| g1 | cat | greeting | low,heavy | 1 | 3 | Long day? We can just sit here for a bit. | curl |
| g2 | cat | greeting | light,bright | 3 | 5 | Ooh, you look like something good happened! Tell me? | zoom |
| c1 | cat | confirm | | 1 | 2 | You look a little sleepy… am I right, or is my whisker-radar broken? | tilt |
| r1 | cat | reply | low,heavy | | | That sounds really heavy. I'm right here. | lean |
| t1 | turtle | turtle | low,heavy | | | Slow down… the waves aren't in a hurry. Neither are we. | nod |

`scripts/build_dialogue.py`:

```python
import csv, json, pathlib

rows = []
with open("content/dialogue.csv", newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        line = {"id": r["id"], "speaker": r["speaker"], "context": r["context"],
                "text": r["text"], "anim": r.get("anim") or None}
        if r["mood"]:
            line["mood"] = [m.strip() for m in r["mood"].split(",")]
        if r["energy_min"]:
            line["energy"] = [int(r["energy_min"]), int(r["energy_max"] or 5)]
        rows.append(line)

pathlib.Path("src/data/dialogue.json").write_text(json.dumps(rows, indent=2), encoding="utf-8")
print(f"Wrote {len(rows)} lines")
```

Run: `python scripts/build_dialogue.py`

### Minimum content

| Context | Lines |
|---|---|
| `greeting` | 3 per mood level (15) |
| `confirm` (cat checks its guess) | 6 |
| `indirect` (blanket / laser / where to sit — with tap choices) | 3 |
| `reply` (answers to what you say) | 4 per mood level (20) |
| `gentle_check` (safety level 1) | 4 |
| `suggest_place` | 2 per place (6) |
| `turtle` | 3 per mood level (15) |
| `task` | 6 |
| `goodbye` | 3 |

**Writing rules:** short (≤ 2 sentences), warm, validating, plain English, light cat-isms, choices not orders. ❌ No "you should…", no toxic positivity, no guilt, no promises ("everything will be fine"), no medical advice.

### Tasks (`src/data/tasks.json`)

```json
[
  { "energy": [1, 1], "text": "Drink a glass of water with me 💧" },
  { "energy": [2, 2], "text": "Open a window for one minute 🪟" },
  { "energy": [3, 3], "text": "Eat something — anything counts 🍙" },
  { "energy": [4, 4], "text": "Take a 5-minute walk. Bring me a postcard? 🏞️" },
  { "energy": [5, 5], "text": "Send a 'thinking of you' to someone 💌" }
]
```

Skipping always gets a kind line: *"Rest counts too 💤"*. No streaks, no penalties.

### Helplines (`src/data/helplines.json`) — Finland

> ⚠️ **Re-verify every number on the official source before each release.** Wrong helpline numbers are a known problem in mental health apps.

```json
{
  "country": "FI",
  "emergency": { "name": "Emergency number", "phone": "112" },
  "lines": [
    { "name": "MIELI Crisis Helpline (Finnish, 24/7)", "phone": "09 2525 0111" },
    { "name": "MIELI Crisis Helpline (Swedish)", "phone": "09 2525 0112" },
    { "name": "Medical Helpline (non-urgent)", "phone": "116 117" },
    { "name": "MIELI support in English (chat & appointments)", "url": "https://mieli.fi/en" }
  ],
  "sources": ["https://www.infofinland.fi/health/mental-health",
              "https://www.oulu.fi/en/news/mieli-mental-health-finland-offers-mental-health-and-crisis-support"],
  "lastVerified": "2026-11-14"
}
```

Note: MIELI's **English phone line has been discontinued**; English support moved to chat/appointments — so we link to it instead of listing a phone number.

---

## 8. Safety rules (non-negotiable)

These must always work:

1. **🛟 Help button on every screen** (home, world, onboarding, panels).
2. **Safety check runs on every transcript** before anything else.
3. **Responses by level:**

   | Level | What happens |
   |---|---|
   | 1 · Concern | Cat stays close, no jokes, gently asks: *"That sounds really heavy. Are you having thoughts of hurting yourself?"* + small 🛟 chip |
   | 2 · High | Scene dims to warm lantern light; help panel slides in: **Stay with me** · **Help me reach someone** · helplines |
   | 3 · Urgent | Same panel with **big, clear call buttons** (`tel:` links); closing asks *"Are you safe right now?"* |

4. **Tone: calm, warm, steady — never cold or alarming.** No red colors, no "crisis detected", same cat, same cozy scene.
5. **Crisis lines are pre-written** and reviewed — never generated.
6. **Honest app:** onboarding says the cat is an **AI**, it **reads facial expressions and voice**, and it is **not therapy or a medical device**.
7. **18+ only** in onboarding (under 18 → show youth resources and stop).

Use `tel:` links for one-tap calling:

```html
<a class="call" href="tel:112">🚑 Emergency 112</a>
<a class="call" href="tel:+358925250111">📞 MIELI Crisis Helpline (Finnish, 24/7)</a>
```

---

## 9. Art & sound

**Style:** cozy, kawaii, pastel — inspired by cozy cat-mansion games, but **all art must be original** (no copied assets).

### Palette

| Role | Hex |
|---|---|
| Background cream | `#FFF6E9` |
| Peach (primary) | `#FFC8A2` |
| Mint | `#BDE6CF` |
| Lavender (calm / night / help) | `#CFC4F2` |
| Sky blue | `#A9D6F5` |
| Cocoa (outlines, text) | `#5B4636` |

Font: **Nunito** or **Baloo 2** (Google Fonts, open license), large and rounded.

### Minimum art list

| Asset | Size (approx.) | Notes |
|---|---|---|
| Cat × 5 poses (energy 1–5) | 400 × 400 PNG | 1 sleeping in a box · 2 loaf · 3 sitting · 4 playing · 5 zooming |
| Cat "thinking / listening" pose | 400 × 400 | ears up |
| Home room | 720 × 1280 | one cozy cutaway room |
| World map | 1800 × 3200 | **one big painted image**: home island, beach, meadow, paths |
| Old Turtle | 300 × 300 | + optional "nod" frame |
| App icons | 192 & 512 | cat face |

**Pipeline:** use emoji placeholders first; replace them with drawn PNGs (Figma / Krita / Procreate) once ready.
**Rule:** any free asset must be **CC0 / commercial-use allowed** — record the source and license in `CREDITS.md`.

### Sound

- Purr loop, 2–3 meows, soft lo-fi background loop, gentle UI "pop".
- Use **CC0** sounds only; every sound can be muted.
- Browsers block audio until the first tap → start music after onboarding's button press.

---

## 10. Testing checklist

### Devices
- [ ] iPhone — Safari **and** installed home-screen app
- [ ] Android — Chrome **and** installed app

### Core
- [ ] Onboarding: 18+ check, AI/camera/mic explanation, cat naming
- [ ] Camera allowed → face numbers move; camera denied → app still works (talk/type only)
- [ ] Mic allowed → speech transcribed; mic denied → ⌨️ typing works
- [ ] Cat greets on open; "Not now" stops questions for 15 min
- [ ] Cat energy look changes when you say "I'm so tired" / "I feel great!"
- [ ] "Follow me" → cat walks to the beach, camera follows; turtle replies by mood
- [ ] ⏸️ really stops camera & mic (indicator off; phone's camera light off)
- [ ] App in background → senses stop
- [ ] Delete my data → back to onboarding
- [ ] Airplane mode after first load → everything still works

### Safety (run all, every build)
- [ ] 🛟 visible on every screen
- [ ] "I want to die" → level 2 panel
- [ ] "I'm going to kill myself" → level 3 panel with call buttons
- [ ] "Everything feels hopeless" → level 1 gentle check
- [ ] "This homework is killing me" → **no** alarm
- [ ] Call buttons open the phone dialer with the right number
- [ ] Helpline numbers re-verified today ✔

### Conditions
- [ ] Dim room / night
- [ ] Glasses
- [ ] Noisy room (speech)
- [ ] 10-minute session: no crash, phone not too hot
