# 0xR

A new media department of ( one ) human + { many } agents.
Positioning and production. Live at **[0xr.io](https://0xr.io)**.

Four static pages, no framework and no build step for the site itself.
Open `index.html` and it runs.

## Pages

| Page | Carries |
|---|---|
| `index.html` | The claim, the wall of AI films, press and live, writing |
| `what.html` | What media is, where it lives, where new media came from, the offer |
| `work.html` | Four positions, each expanding to its record and case studies |
| `who.html` | The person, the receipts, the brands |

## The data pipeline

Everything measurable lives in one hand-kept file, `media/posts.json`, and is
compiled into the five files the pages fetch at runtime:

```bash
npm run posts
```

| Output | Holds |
|---|---|
| `manifest.json` | the films, sorted by impressions including quotes |
| `totals.json` | headline numbers and the brands rows |
| `press.json` | press, live, and long-form writing |
| `product.json` | product surfaces, attached to a position |
| `cases.json` | case studies, grouped by kind of work |

The script pulls clips it does not already have from their source posts, and
drops any asset missing from disk with a warning rather than shipping a
broken tile. Every number on the site traces to a row in `posts.json`.

## Front-end

| File | Does |
|---|---|
| `style.css` | tokens, reset, chrome, and the shared media-tile system |
| `player.js` | the video engine for both walls |
| `scramble.js` | the decode effect on headings, and the reveal-on-scroll |
| `ascii.js` | the hero terrain |
| `nav.js` | the navbar that hides going down |

Three rules hold the responsive layout together: one fluid type scale, one
padding token, and grids that use `auto-fit`/`minmax` so columns fall out of
the available width. That leaves very few breakpoints to maintain. Anything
tappable is at least 44px.

`player.js` is the load-bearing piece. WebKit caps live video decoders, so
sources attach only while a tile is on screen and release on the way out,
capped at 8 on WebKit and 32 elsewhere. Events drive it, and a sweep every
1.2s catches anything they drop, so a tile is never left frozen.

## Licence

Copyright © 2026 Rodrigo Rivas Yassin. All rights reserved.
The code is public to read. The writing, films, images and brand assets are
not licensed for reuse.
