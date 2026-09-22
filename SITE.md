# 0xR site

*The public face. Handoff note, rewritten 2026-09-03.*

---

## One repo, one site

**This repo is the site.** Files at the root, edited here, deployed by Vercel to
**0xr.io**. Run `npm run posts` at the root after touching `media/posts.json`.

The old two-repo split (private workspace + public artefact + filter script) existed
only to keep the CV pages' personal data out of a public repo. The CVs moved to
`~/Desktop/My_Personal_Agents/cv/` on 2026-09-22, this repo's history was restarted
clean, and the machinery went with the reason for it.

## The four pages

| Page | Carries |
|---|---|
| `index.html` | The hero: three sentences over the six crew figures. Then 19 AI films, press and live, writing. The ASCII terrain is the footer's ground now |
| `what.html` | The argument in three steps, then the offer: 01 Direction, 02 Production with the crew inside it, 03 Distribution as coming soon. Ends on the address |
| `work.html` | Four positions as an accordion: 0xR, Sail, Fungi, Boveda. Fungi and Sail carry case studies |
| `who.html` | The person, six receipts, the brands rows |

Nav order is **what / work / who**: the offer, the proof, the person.

## The argument on the what page

The page runs on one definition and one vocabulary. Media is **everything that
carries your story to a person**; positioning is where the story comes from;
production is the story made. The word is *story*, never *claim* — that
matches `POSITIONING.md` §2, "Story, made, moved."

Four surfaces, each with a definition and its disciplines: **Brand, Film,
Comms, Product**. Launch was removed: it is how carriers get moved, not a
carrier, and it already lives under go-to-market.

**Go-to-market is withdrawn from the public offer** (2026-08-30). a16z's GTM
works because they own the platform under it; 0xR does not own one yet. The
reasoning and the archived copy are in `_archive/gtm/OFFER.md`. The record of
GTM shipped stays on the work page: receipts of the past, not promises.

## How the data works

Everything measurable lives in `site/media/posts.json` and compiles by
`npm run posts` into five files the pages fetch at runtime: `manifest.json`,
`totals.json`, `press.json`, `product.json`, `cases.json`.

Rules the script enforces: an asset not on disk is dropped with a warning, and
a category with no surviving assets is dropped whole. It never ships a broken
tile. `_archive/agent-factory/scripts/media.mjs` stays archived on purpose. It
rebuilds the manifest from directory contents, which would erase every
`href`, `views` and `amplifiedBy` field. Do not restore it.

## The look is the studio's, not just the site's

`DESIGN.md` (2026-09-04) makes the 0xR system the only look the studio uses,
for client documents as well as pages. `style.css` is its source of truth, so a
token changed here changes every document the studio ships. One thing to know
when a document leaves this machine: **Oliveira must be inlined as a base64
`@font-face`**, because a relative font URL resolves to nothing once a page is
published. `clients/alle/positioning/brand-audit.html` is the worked example.

## The front end

| File | Does |
|---|---|
| `style.css` | tokens, reset, chrome, the shared media-tile system, `.creed` |
| `player.js` | the video engine, shared by both walls |
| `crew3d.js` | the six crew figures: voxel rig, turn, acts, decode |
| `crew/*.model.js` | one figure each, the cell grid and its depth map |
| `scramble.js` | the decode effect on headings, and reveal-on-scroll |
| `ascii.js` | the terrain, in the footer since 2026-09-09 |
| `nav.js` | the navbar that hides going down |

**The crew's workshop stays in studio.** `crew/gen/`, the depth maps,
`mkmodel.py` and every contact sheet are excluded by `publish.sh`; the site
loads `crew3d.js` and the six models and nothing else there. A figure's PNG
rebuilds from its model exactly, which is how the rejected QUENT was undone.

Every figure renders pixel-identical to its source at rest, asserted 1792 of
1792 cells, six times. Three things were measured rather than argued: a solid
column projects `W*cos + D*sin` cells on a turn so every one-cell gap closes
(thin cards fix it); a curved face plate shears a sunglasses bar in two by -20;
the idle sweep caps at 12. QUENT is held near front on by temperament, because
his eyes are scattered cells rather than a mass and a turn swallows them.

Three rules hold the layout: one fluid type scale, one padding token, and
grids on `auto-fit`/`minmax` so columns fall out of the width. Anything
tappable is at least 44px. Paper is bone `#FAF8F4`, never white.

**Do not re-inline these scripts.** The navbar and the terrain once shared a
`<script>` block, and extracting one silently deleted the other.

## Video, hard won

1. **WebKit caps live decoders.** Sources attach only while a tile is on
   screen, capped at 8 on WebKit and 32 elsewhere. Every clip has a real
   poster underneath, so the worst case is a still.
2. **Autoplay needs the properties**, not just the attributes, and `play()`
   rejects before anything is decoded. Try now, try again on `canplay`.
3. **Events alone are not enough.** A missed observer batch or a rejected
   `play()` would leave a tile frozen, which is why only part of the wall
   used to come alive. A sweep every 1.2s is the guarantee.

Anything touching video gets checked in Safari, not only Chrome.

## Share cards

One card per page, `media/card-{index,what,work,who}.jpg`, rendered in the
real display face at 2x by `scripts/cards.sh`. Regenerate after a headline
change, or the link keeps showing the old words.

## Open, needs Rodrigo

1. **Three primacy claims carry no receipt** (see below), and the Fungi case
   shows `$9M MC` against a Dexscreener chart reading 8.76M. Rodrigo's ruling
   2026-09-09: $9M stands.
2. **Allé: no case study until he says so** (2026-09-03). The work is in
   progress and cannot be shown as a case yet. It does not need to be: the
   MID 90'S film is rank 1 of 20 on the wall at 83,200 impressions, the
   best-performing work on the site, and it is the culture work. Allé also
   appears in the brands row and on the 0xR entry. The "12:1 crypto to
   culture" line in the 2026-09-01 audit counted brands, not weight of
   evidence, and overstated the gap.
3. The three claims: first autonomous non-custodial swaps and bridges, first
   open-source permission-layer protocol, among the first 100% AI films.
4. **`$1.1M+ AUM` and `2,000+ unique users`** are the only unsourced numbers.
5. **PiKNiK spelling**, dictated as "pknik", still unconfirmed, live on work.
6. **Boveda title.** The site says cofounder. LinkedIn still says CMO.
7. **The second outperformance article** never arrived. One is linked.

Settled 2026-09-09: the crew live on the hero and the terrain is the footer's
ground. The market comes off the line, which reads "for brands". Positioning is
a discipline under Direction, not a function beside Production. The what page
ends on the address; before that it argued for four screens and offered no way
to reach him. Phone captions are on under `(hover: none)`. The mono is named
(IBM Plex Mono) rather than left to the reader's OS. The gold $500M card is off
the wall via `wall: false`, which keeps its reach in the topline. The receipts
no longer decode. The phone replay is fixed and **confirmed on device**: a
mobile browser fires `resize` on every scroll as its URL bar hides, and the
hero was rebuilding its figures on it.

**Corrected 2026-09-09: MID 90'S plays in Safari.** It is VP9, and AVFoundation
reports it undecodable, but Safari does not use AVFoundation and has had its own
VP9 decoder since 2020. Rodrigo had watched it play. Do not re-raise this.

Settled earlier: the market is **tech and culture brands**, named
in the hero and carried through work.html and the meta descriptions. 56 yield
sources (pinned in `TIMELINE.md`). 0xr.io with a zero. Sail case study built.
The ASCII animation restored. Safari autoplay fixed: the cap was ours, not the
browser's, and it now keys off the device (6 on iPhone and iPad, 32 elsewhere).

**When the browser is the only witness, instrument rather than theorise.** The
Safari bug took two wrong fixes reasoned from theory and one `?debug` readout
to solve. The same applies to the hover decode and the ASCII terrain: this
dev pane throttles timers, kills rAF, and reports `document.hidden: true`, so
it cannot see any of them.

## 2026-09-18 — the turned faces, dispatched

Six attempts at deriving a turned face from the front grid were rejected. The
front faces were never drawn: `crew/gen/prompts.md` records that QUENT
generated them and `proc.py` quantized them. So the turned faces go the same
way, and the studio stopped hand drawing pixel art it cannot see.

Two bridges out, parallel, non-overlapping:

- **QUENT** — the turned BASE prompt block and seven three-quarter takes,
  validating on rodrigo before spending on the rest. Lands as
  `site/crew/gen/<name>-turn.png` plus a dated section in `gen/prompts.md`.
- **JEAN** — the identity ruling: the anchor per figure, what a 20 to 25
  degree turn threatens, an unambiguous drift checklist, and the pale-head
  problem that QUENT and KIM both fail on. Lands in her own workspace.

The studio owns the plumbing between them. `vox.py turn <name>` fits a
generated take onto the front view's row spans and writes `<name>.turn.txt`;
`round` paints it pre-rotated and mirrors it; `crew3d.js` swaps it in past 16
degrees of head yaw and back under 10. Chain proven with a synthetic map
before any take existed. Nothing of this is committed or pushed.
