# 0xR site

*The public face. Handoff note, rewritten 2026-10-20. The version before this one,
written 2026-09-03 for the what/work/who site, is in git history.*

---

## One repo, one site

**This repo is the site.** Files at the root, edited here, deployed by Vercel to
**0xr.io** on every merge to `main`. Run `npm run posts` at the root after touching
`media/posts.json`.

The CVs moved to `~/Desktop/My_Personal_Agents/cv/` on 2026-09-22 and this repo's
history was restarted clean after the move. No personal data lives here.

## What the site says

**Branding and generative media production**, ruled 2026-10-13 and carried in
`studio/POSITIONING.md` and `studio/clients/0xr/positioning/services.md`.

- Hero: "A crew of ( one ) human + { many } agents."
- Meta description: "We do branding and generative media production at a fraction
  of the time/cost of an agency."
- Tab title on the home page: `0xR / branding + media`. The others are
  `0xR / work` and `0xR / who`.

The word is always *crew*. Sail, Fungi and Boveda are described as onchain finance.

## The three pages

Clean URLs through `vercel.json` (`cleanUrls`, no trailing slash).

| URL | File | Carries |
|---|---|---|
| `/` | `index.html` | The hero over the crew figures, the AI films wall, the why block. The film card (`promo.js`) is on this page only. The crew lives here and only here |
| `/work` | `work.html` | Three entries as an accordion: Allé Studios, Sail, Fungi |
| `/who` | `who.html` | Him alone: the bio beside his figure, then four short lists on the same rail: open source (Sailor, Sail Protocol), companies cofounded (Sail, Fungi, Boveda), writing, press and live. Hover an item and its picture or clip appears in the open column to the right; on touch each item carries a still at the end of its row. Writing and press come from `media/press.json` |

Nav order is **work / who**. The crew page and the more page were folded into
`/who` on 2026-10-20 (his call): the agents left it, and the writing and press
moved under him. Old paths redirect permanently: `/index`, `/home`, `/thesis`
go to `/`; `/studio` goes to `/work`; `/crew` and `/more` go to `/who`.
Add a redirect whenever a page is renamed, because shared links outlive the page.

**No total views on the site until the total passes 1M** (his ruling). The per-film
numbers stay. The figures on the Sail entry are canonical and come from
`studio/clients/sail/CLIENT.md`.

## The look

`studio/DESIGN.md` makes the 0xR system the only look the studio uses, and
`style.css` here is its source of truth. Bone paper `#FAF8F4`, ink, Oliveira for
display, Instrument Sans for body, IBM Plex Mono for labels. One fluid type scale,
one padding token, grids on `auto-fit`/`minmax`, anything tappable at least 44px.

When a document leaves this machine, **Oliveira must be inlined as a base64
`@font-face`**, because a relative font URL resolves to nothing once a page is
published.

**Colour arrives as an event.** DESIGN.md rule 2 was amended twice:

1. 2026-10-19: "i want colours but it needs to feel that black and white is the
   core of it." Bone and ink are the identity at rest. Colour appears inside glitch
   moments, transitions and the films.
2. 2026-10-20: a fixed glitch set of its own, a step off Paradigm's Frontiers
   stream. Mint, vermilion, orange, magenta, lavender, gold and cream, with paper
   and ink. It lives in `glitch.js` as `GC` and `STAGES`, and it never touches type,
   chips or fills at rest.

The look rules and the rounds that got there are in
`jean/projects/0xr-glitch/2026-10-19-rules.md`. The colour overrulings are in
`ye/clients/rodrigo/2026-10-19-glitch-colour.md`.

## The glitch organism

`glitch.js` runs on every page. It paints on two fixed canvases: `canvas.organism`
(z 61) for the live glitch and `.residue` (z 60) for what it leaves behind. Every
loop steps at 30fps through `run()`, and a frame callback that returns `false`
ends its loop early and clean.

**Three triggers.**

1. **Hover** on a film tile or an image glitches that element. Touch has no hover, so on a phone the film crossing the middle of the screen glitches while the page scrolls, one at a time, drawn inside the film so it moves with the page (his call, 2026-10-20).
2. **Scroll** fires short sudden bursts.
3. **Idle.** After 8 seconds with no input the organism starts to take the page
   over, and by 55 seconds it is at full strength. Any input hands the page back.

**The scene composer.** The screen is one scene at a time: a small palette and a
few kinds of shape over a fine stripe ground (grey, dark, or none), and the next
scene paints over the last. Everything that glitches draws from the current
scene, so the page reads as one composition. The stages play in a fixed order,
green first, because the old gold stage was "too yellow":

| Stage | Ground | Shapes |
|---|---|---|
| garden | none | strokes, moss, ribbon |
| tide | grey | strokes, ribbon, bars, shard |
| ember | grey | strokes, steps, bars, shard |
| bloom | none | ribbon, strokes, moss, shard |
| signal | grey | shard, steps, barcode, strokes |
| moss | grey | moss, barcode, bars, ribbon |
| night | dark | bars, barcode, shard, strokes |
| dusk | grey | sparse |

The letters inside the glitch are hex strips (`hexAt`), a character flipping now
and then as it corrupts.

**The spared title.** When the organism takes the page, the page's `h1` stays,
floating on frosted glass (`.spared-glass`) as wide as its words. With the title
in view the glass lies exactly over it; scrolled away from it, the glass floats
at the middle of the screen on the same rail, so the title appears wherever the
reader is (his call, 2026-10-20). Each word turns ink or paper by reading the
residue behind it. The title is built from `settledText()`, which strips the
scramble's `aria-hidden` layer; built mid-scramble, it came out garbled.

**Scrolling stays practical.** `scrolling()` is true for 140ms after the last
scroll event: bursts end and hovers wait. `settling()` is true for 700ms: the
organism waits before it wanders again. A hover that lands during a scroll is
queued as `pendingHover` and fires once the page stops, which took hovers right
after a scroll from missing some of the time to 12 of 12.

**Hard won.**

1. A burst drawn on the overlay must clear its previous rectangle every frame
   and end on scroll, or a moving page leaves copies behind.
2. Large shapes use bigger cells. A big bloom at small cells cost a 133ms frame.
3. `getImageData` on a cross-origin frame throws. It is wrapped, and the loops
   recover instead of dying.

Measured on the live site at merge: 60fps, no console errors, hovers 12 of 12,
no leftover glitch pixels while scrolling. `_ref/` holds his reference recordings
and the perf probes. It is untracked and never deploys.

## The frames on the figures

`frame.js` draws a hover frame on every figure on the home stage and on his figure
on `/who`. His is mint, with a filled `human` tag and his X and LinkedIn handles as
links. The six agents' are orange, with a filled `agent` tag and what each one
does: YE brand, QUENT films, JEAN art direction, FRANK words, STEVE design, KIM go
to market. Past 60% of the stage the tags hang from the frame's right edge so they
stay on screen. The hero clips at its foot, where the figures stand on a phone, so
the square's lower edge comes up to stay whole. Both colours come from the glitch set and appear only on hover.

## The player (wav)

`music.js` adds **wav** to the nav on every page. It opens a white classic iPod that rises from the bottom right. On it, 0xR is the artist and **Residue** is the one track (`media/music/residue.mp3`, 128 kbps, 2.9 MB, made with ElevenLabs plus the local glitch orchestra; source and audit in `My_Agents/projects/residue/`). The cover is a frame of the glitch takeover.

- **Screens.** The track list, and Now Playing with a progress bar, elapsed and remaining time. "made with AI" sits on both.
- **Click wheel.** MENU goes back; the centre selects or plays; the bottom button plays or pauses; the sides restart. Turning the ring sets the volume.
- **Keys.** Space plays and pauses, the arrows skip and set volume, Esc closes.
- **Layers.** It sits at z 64, above the organism and the spared title, so it stays reachable through a takeover. Opening it closes the THESEUS card.
- **Across pages.** Position, volume and the wish to play are kept in `sessionStorage`. A browser won't let a new page play sound before a press, so the music resumes on the first click or key on the next page.
- **Media Session.** Fills the phone lock screen with the cover, title and artist.
- **Loading.** Nothing loads until play. A single track loops.
- **Adding a track.** Add a row to `TRACKS` in `music.js`. The list, skip and the lock screen pick it up.

Licence: paid ElevenLabs plans, Starter included, carry a commercial licence. Check the Music Terms for the plan before using a track anywhere beyond the site.

## The front end

| File | Does |
|---|---|
| `style.css` | tokens, reset, chrome, the shared media-tile system, `.creed`, `.spared-glass` |
| `glitch.js` | the glitch organism, on every page |
| `frame.js` | the hover frames on the figures |
| `music.js` | wav: the iPod player and its one track |
| `player.js` | the video engine, shared by the walls |
| `promo.js` | the film card, home page only |
| `crew3d.js` | the crew figures: voxel rig, turn, acts, decode |
| `crew/*.model.js` | one figure each, the cell grid and its depth map |
| `scramble.js` | the decode effect on headings and reveal-on-scroll; listens for `0xr:scramble` to replay |
| `ascii.js` | the terrain in the footer |
| `nav.js` | the navbar that hides going down |

**Do not re-inline these scripts.** The navbar and the terrain once shared a
`<script>` block, and extracting one silently deleted the other.

**The crew's workshop stays in studio.** `crew/gen/`, the depth maps, `mkmodel.py`
and the contact sheets never come here. The site loads `crew3d.js` and the models
and nothing else. Every figure renders pixel-identical to its source at rest,
asserted 1792 of 1792 cells per figure.

## How the data works

Everything measurable lives in `media/posts.json`, and `npm run posts`
(`scripts/posts.mjs`) compiles it into five files the pages fetch at runtime:
`manifest.json`, `totals.json`, `press.json`, `product.json`, `cases.json`.

An asset not on disk is dropped with a warning, and a category with no surviving
assets is dropped whole, so a broken tile never ships.
`_archive/agent-factory/scripts/media.mjs` stays archived on purpose. It rebuilds
the manifest from directory contents, which would erase every `href`, `views` and
`amplifiedBy` field. Do not restore it.

## Share card

One card for every page, `media/card.jpg`, 1200 by 630, rendered at 2x in the real
display face by `scripts/cards.sh`. The pages carried identical copy, so four
cards were four copies of one file. Regenerate after a headline change, or a
shared link keeps showing the old words. If a page ever gets its own headline, add
its row back to the script and point that page's `og:image` at it.

## Video, hard won

1. **WebKit caps live decoders.** Sources attach only while a tile is on screen,
   capped at 6 on iPhone and iPad and 32 elsewhere. Every clip has a real poster
   underneath, so the worst case is a still.
2. **Autoplay needs the properties** as well as the attributes, and `play()`
   rejects before anything is decoded. Try now, try again on `canplay`.
3. **Events alone are not enough.** A missed observer batch or a rejected
   `play()` leaves a tile frozen. A sweep every 1.2s is the guarantee.
4. **MID 90'S plays in Safari.** It is VP9 and AVFoundation reports it
   undecodable, but Safari has had its own VP9 decoder since 2020. Do not
   re-raise this.

Anything touching video gets checked in Safari as well as Chrome.

## Testing

**When the browser is the only witness, instrument it.** The dev pane throttles
timers, kills rAF and reports `document.hidden: true`, so it cannot see the glitch,
the decode or the terrain. Headless `--screenshot` caught the organism at random
moments. What worked: Chrome over the DevTools protocol, driven by Node 22's
built-in WebSocket, running in real time, with `Page.captureScreenshot` for frames
and the performance timeline for frame times. A mobile browser fires `resize` on
every scroll as its URL bar hides, so anything rebuilt on resize gets tested on a
device.

## Open, needs Rodrigo

1. **Two primacy claims on `/work` carry no receipt:** Sail as the first agent to
   run swaps and bridges autonomously without custody, and the first open source
   permission layer.
2. **The profile fields on GitHub.** The bio and website fields need the `user`
   scope, which this machine's `gh` login lacks. Either run
   `gh auth refresh -h github.com -s user` or paste them at
   github.com/settings/profile: bio "A crew of ( one ) human + { many } agents.
   Branding and generative media production.", website `https://0xr.io`.
3. **The second outperformance article** never arrived. One is linked.

Settled and closed: the Fungi `$9M` market cap stands (2026-09-09). Allé has its
entry on `/work`. Total views come back once they pass 1M.
