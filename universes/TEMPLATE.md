# UNIVERSE BUILD — deliverable template

*What a client receives. One universe = one directory under `universes/<brand>/`,
built in this order. The build is done when every section below exists and the
seal is carved. The living retainer then operates it.*

---

## 0. The brief (one page, written first)

- **The brand**, in its own words and ours.
- **The market's culture**: where does attention live for this brand — which
  scenes, which surfaces, onchain or off? If the market has no culture the
  engine can listen to, we decline the client (INNIE.md §5 — the one test).
- **What "traveled" means here**: the outcome the brand actually wants, stated
  measurably. This becomes the scorer's definition later.

## 1. The soul — `soul.md` (Layer 0)

Per [SOUL.md](../SOUL.md): frontmatter + four organs. Written *with* the client,
owned *by* the client. The canon workshop is the first working session: who is
this character, what does it want, what would it never say. TASTE's Never list
must reach at least six entries before the soul is accepted — a short Never list
is a generic character (SOUL.md §2).

## 2. The bible — `bible.md` (Layer 2)

The universe's visual and tonal law, structured like [BRAND.md](../BRAND.md):

- One breath; visual law (palette values, type, texture signature); what never
  ships. The **one-second test** is mandatory: recognizable without a logo.
- **The seal**: carved last, the character's own mark, in its own color. The
  seal is the disclosure (BRAND.md §5) — stamped on everything.
- Prompt/workflow appendix: the reusable generation recipes that keep AI output
  consistent with the law. This appendix is studio-internal (machine private).

## 3. The listening — `listening.md` (Layer 1 config)

What the engine watches for this universe:

- **Scenes** it lives in, **currents** it rides, border scenes worth watching.
- **Sources**: which surfaces matter for this market and any brand-specific taps.
- **Rivals and neighbors**: names whose ignitions are opportunities by proximity.
- **Self-sources**: the brand's own channels, registered so they can never count
  as evidence (self-ingestion guard, inherited law).

## 4. The formats — `formats.md` (Layer 3 seed)

- Channels the innie speaks on, and the grammar of each (hook shape, length,
  cadence, what a citation looks like there).
- The **decline rule** restated per channel: what this character won't post even
  when the engine flags it.
- Publishing cadence and the curator: who on the client side approves, until
  the ledger earns autonomy.

## 5. The ledger — `ledger/` (receipts from day one)

Same law as the house: append-only JSONL, candidates/kills/declines all kept,
misses forever. The monthly report to the client is *generated from* the ledger,
never written beside it.

---

## Build order & acceptance

| Step | Artifact | Accepted when |
|---|---|---|
| 1 | brief | client signs the one page |
| 2 | soul.md | loads in the pipeline; Never ≥ 6; client reads it aloud and says "that's them" |
| 3 | bible.md | three test pieces pass the one-second test |
| 4 | listening.md | engine configured; first week of topics reviewed together |
| 5 | formats.md | first rehearsal run reviewed (voice + editor, not published) |
| 6 | the seal | carved, stamped on the first shipped piece |

The retainer begins at step 6. Nothing publishes before the seal exists.
