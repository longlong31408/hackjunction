# Art overrides

All of Mochi's art is drawn in code (`src/art/`). To replace a texture with a drawn PNG:

1. Put the PNG here, e.g. `public/art/cat_energy1.png` (transparent background).
2. List it in `manifest.json` by texture key: `{ "cat1": "cat_energy1.png" }`.

Texture keys and sizes: `cat1`–`cat5` (energy looks, 400×400, feet at 200,340), `catListen`, `catEat`,
`catHappy`, `walk0`–`walk3` (200×200), `room` / `roomNight` (720×1280), `map` (1800×3200),
`turtle` / `turtleNod` / `sheep` (300×300, feet at 150,262).

Any asset you add must be your own or CC0 / commercial-use allowed — record it in `CREDITS.md`.
