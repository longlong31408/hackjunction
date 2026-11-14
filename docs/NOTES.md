# Build notes: where Mochi differs from the development guide

Everything in the guide's **Must have** and **Should have** lists is built, plus three of the four **Could haves**, plus six extra small activities the cat can suggest (5-4-3-2-1 grounding, stretching, play, one good thing, reaching out, winding down). These are the deliberate differences, and why.

| Guide | This build | Why |
|---|---|---|
| `safety.js`: if an idiom such as "killing me" appears, only urgent phrases are checked | Idioms are **removed** first, then every level is checked | With the starter code, "this week is killing me and I want to die" returned 0 (no help at all). Now it returns 2. |
| `mic.js` decodes with `new AudioContext({ sampleRate: 16000 })` | Decodes normally, then resamples with an `OfflineAudioContext` | More reliable on iOS Safari. |
| Art as PNG files in `public/art/` | All art is drawn in code (`src/art/`); PNGs listed in `public/art/manifest.json` override any texture | Original art from day one with no licensing questions, and the guide's swap-in-PNGs pipeline still works. |
| Sounds as CC0 MP3 files | Synthesised with Web Audio (`src/ui/sound.js`) | Original, tiny, and every sound is still mutable. |
| `tasks.json` with one task per energy level | 16 tasks over energy ranges; 3 are picked per day, kept in memory only | The guide asks for 3 daily tasks sized to energy and lets storage hold only name, settings and last energy/mood. |
| `reply` lines picked by mood score only, one line per turn | A conversation engine (`src/brain/conversation.js`) built on motivational interviewing and validation research: it reflects the person's feeling and life area, validates or affirms, then makes **one** next move: a single open question (never three in a row), a summary it checks with you, or a small activity from the coach (`src/brain/coach.js`). Session memory only. See [CONVERSATION_GUIDE.md](CONVERSATION_GUIDE.md). | One mood-picked line felt cold and could even be cheerful after "I was really tired". Every line is still pre-written, so nothing is generated. |
| Dialogue CSV columns | Two optional columns added: `choices` (`Label=effect\|…`) and `tag` (place) | Tap choices and place-specific lines. The build script validates both. |
| Transformers.js examples (v3) | `@huggingface/transformers` 4.3 | Same `pipeline()` API; the latest version at build time. |
| `HomeScene` cat at (360, 900) | Cat's feet at (360, 950) on the rug, with origin (0.5, 0.85) | Leaves room for the speech bubble above the bottom bar on phones. |
| Old Turtle at `beach.x + 150` | At `beach.x + 200` | The cat stood on top of the turtle. |
| Hosting on Netlify or GitHub Pages | GitHub Actions workflow to GitHub Pages | The repo is on GitHub, so every push to `main` deploys. |

Not built: **always-listening mode** (could-have). Tap-to-talk keeps the microphone off except while you are talking, which fits the privacy promise better.

Still needed before a public release (from the guide's checklist): testing on a real iPhone and Android phone, in dim light, with glasses and in a noisy room, a 10-minute heat and battery session, professional review of all dialogue and safety copy, and re-verifying every helpline number.
