# Build notes: where Mochi differs from the development guide

Everything in the guide's **Must have** and **Should have** lists is built, plus three of the four **Could haves**. These are the deliberate differences, and why.

| Guide | This build | Why |
|---|---|---|
| `safety.js`: if an idiom such as "killing me" appears, only urgent phrases are checked | Idioms are **removed** first, then every level is checked | With the starter code, "this week is killing me and I want to die" returned 0 (no help at all). Now it returns 2. |
| `mic.js` decodes with `new AudioContext({ sampleRate: 16000 })` | Decodes normally, then resamples with an `OfflineAudioContext` | More reliable on iOS Safari. |
| Art as PNG files in `public/art/` | All art is drawn in code (`src/art/`); PNGs listed in `public/art/manifest.json` override any texture | Original art from day one with no licensing questions, and the guide's swap-in-PNGs pipeline still works. |
| Sounds as CC0 MP3 files | Synthesised with Web Audio (`src/ui/sound.js`) | Original, tiny, and every sound is still mutable. |
| `tasks.json` with one task per energy level | 16 tasks over energy ranges; 3 are picked per day, kept in memory only | The guide asks for 3 daily tasks sized to energy and lets storage hold only name, settings and last energy/mood. |
| `reply` lines picked by mood score only | Replies are picked by **what the person talks about** first (tired, sad, lonely, stressed, angry, bored, happy — `src/brain/topics.js`), echo their feeling word, and the words outrank the sentiment model | Testing showed "I was really tired" could be scored POSITIVE and answered with "Zoomies! I'm so happy for you". Now it gets "Really tired… that sounds draining" and a gentle "Rest with me". |
| Dialogue CSV columns | Two optional columns added: `choices` (`Label=effect\|…`) and `tag` (place) | Tap choices and place-specific lines. The build script validates both. |
| Transformers.js examples (v3) | `@huggingface/transformers` 4.3 | Same `pipeline()` API; the latest version at build time. |
| `HomeScene` cat at (360, 900) | Cat's feet at (360, 950) on the rug, with origin (0.5, 0.85) | Leaves room for the speech bubble above the bottom bar on phones. |
| Old Turtle at `beach.x + 150` | At `beach.x + 200` | The cat stood on top of the turtle. |
| Hosting on Netlify or GitHub Pages | GitHub Actions workflow to GitHub Pages | The repo is on GitHub, so every push to `main` deploys. |

Not built: **always-listening mode** (could-have). Tap-to-talk keeps the microphone off except while you are talking, which fits the privacy promise better.

Still needed before a public release (from the guide's checklist): testing on a real iPhone and Android phone, in dim light, with glasses and in a noisy room, a 10-minute heat and battery session, professional review of all dialogue and safety copy, and re-verifying every helpline number.
