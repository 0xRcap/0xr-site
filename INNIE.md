# INNIE — Studio Constitution v1

*A boutique creative studio. Digital universes for brands, inhabited by characters
with souls.*

This document is the studio's constitution, in the tradition of HEAT's BRAND.md:
code changes weekly, this should barely change at all. When a decision fights the
constitution, the decision is wrong or the constitution gets amended deliberately —
an amendment is a commit with a dated reason, never a vibe.

---

## 1. What innie is (one breath)

innie builds digital universes for brands and populates them with **innies** —
digital characters that live inside the brand's world and make its content. Today
that means AI films with a soul behind them. Tomorrow it means the character itself:
software the brand runs, an agent that knows its market, watches its culture, makes
its content, and eventually places it. The studio is boutique by law, not by stage:
few clients, chosen, grown slowly.

## 2. The thesis: slop is soullessness

**Content agents will produce slop unless they are given a digital soul.**

Slop is not a quality problem — it's a structural one. Slop is content with no
memory, no stakes, and no accountability: nothing behind it that persists, risks
anything, or can be wrong. Adding a better model to a soulless pipeline produces
better-rendered slop.

A soul is the structural cure, and it has exactly four organs:

1. **Canon** — who the character is: history, world, relationships, what it wants.
2. **Taste** — what it would never make, say, or touch. Taste is defined by refusal.
3. **Memory** — it remembers what it said last month and its story accumulates.
   A character that can't remember can't have meant anything.
4. **Receipts** — a public track record: claims with timestamps, scored, misses kept
   forever. A character that can be visibly wrong is a character with stakes.

This is HEAT's house law generalized: *never fake data, receipts append-only, misses
stay forever* turns out to be a theory of character, not just of measurement. An
innie is structurally incapable of slop for the same reason HEAT's ledger is
structurally incapable of lying.

## 3. What an innie is / is not

- An innie is a **character**, not a mascot. Mascots pose; characters act, want,
  remember, and take positions in their world.
- An innie is **owned by the brand**. The universe, the canon, the audience, the
  ledger — the client's asset, built by the studio. We are the studio, never the
  landlord.
- An innie **cites its world**. Its content rides measured cultural moments (the
  engine's receipts), not a content calendar.
- An innie is **not a chatbot**. It speaks in artifacts — films, posts, drops — on
  its own cadence. Conversation may come later; broadcast character comes first.
- An innie is **never undisclosed**. It is openly synthetic. The craft makes people
  care *although they know* — that's the whole trick, and hiding it would forfeit it.

## 4. The engine stack

Four layers. Each is a discipline with its own document; the stack is the studio.

| # | Layer | Question it answers | Where it lives today |
|---|-------|--------------------|----------------------|
| 0 | **THE SOUL** | Who is speaking? | [SOUL.md](./SOUL.md) + `souls/` — the spec and the characters. Voice head v0 in `src/`. |
| 1 | **THE CULTURE** | What is the world doing right now? | HEAT — the culture & attention engine (scenes, surfaces, phases, Δ). Stays its own machine; innie consumes `/api/briefs`. |
| 2 | **THE AESTHETIC** | What does this universe look like? | Per-universe visual bible, in the client's universe repo. The method is HEAT's BRAND.md §4 generalized: palette law, type law, a sigil, the one-second test. |
| 3 | **THE VIRALITY** | Why would anyone pass this on? | Format grammar per platform, timing from HEAT's phase model (ride IGNITION, never PEAK), format→outcome scoring fed back into the ledger. |

Layer 4 — distribution intelligence, the innie placing its own content, and
eventually innies transacting with other brands' agents — is the endgame, not the
roadmap. It gets built when layers 0–3 have receipts.

Two structural laws of the stack:

- **The machine stays private; the character is public.** HEAT's scoreboard law,
  inherited whole. Clients see the innie and its ledger; nobody sees the taxonomy,
  the corroboration math, or the prompt stack.
- **Taste lives above the machine.** CULTURE.md §5 already drew this line: the
  instrument reads temperature, not taste. Layers 0 and 2 are where taste lives —
  human, curated, the studio's actual craft.

## 5. The studio model

- **Curated by law.** A handful of clients in year one. "innie doesn't work with
  everyone" is the marketing. Every client must pass one test: does this brand have
  a market with a *culture* — somewhere the engine can listen?
- **Two-part engagement.** THE UNIVERSE BUILD (one-time: soul, canon, aesthetic
  bible, scene configuration in the engine) then THE LIVING RETAINER (the innie
  operating: briefs, films, posts, ledger, monthly earliness report).
- **The pilot rule.** First clients come from scenes the engine already instruments
  (crypto, gaming) so Layer 1 works on day one while Layers 2–3 harden on real work.

## 6. Why it's an investment (the pitch, four claims)

1. **Agency work depreciates; an innie compounds.** A campaign is consumed. An innie
   accumulates canon, memory, audience, and track record — every month of operation
   makes the asset worth more, and the brand owns it.
2. **The ledger makes content ROI auditable.** Hash-chained receipts, per client:
   *your character called this moment hours before the record printed — here's Δ,
   here's the median over the quarter.* No agency can show this. It converts
   marketing spend from a faith purchase into a measured position.
3. **The optionality stack.** They buy content → the character becomes an owned
   channel → the channel becomes a software seat → the seat becomes an agent. Each
   stage is paid for by the previous one.
4. **The timing asymmetry.** If every brand ends up with agents, character equity
   built now is a head start on an inevitability; waiting means a cold start in a
   world of warmed-up rivals.

## 7. The flywheel: the house innie is client zero

The studio's own character runs on the full stack in public — making films about
whatever HEAT says is igniting, stamped with receipts. Every piece it publishes is
simultaneously content, a live demo, and proof. Brands are not pitched; they watch
the machine work and come asking. The house soul lives at
[souls/house.soul.md](./souls/house.soul.md); the Patron/Curator duo (the v4 thesis)
are house innies two and three when the first is running.

Rule inherited from HEAT and now load-bearing: **the house innie never counts as its
own evidence.** Self-published work is filtered at ingestion and can never
corroborate a moment (the self-ingestion guard, already law in the engine).

## 8. House rules (non-negotiable, inherited whole)

- Never fake data. Null is null, "—" is "—".
- Receipts append-only; misses stay on the ledger forever. One quiet deletion kills
  the thesis.
- Scoreboard public, machine private.
- Every claim carries a number or it doesn't ship.
- One writer per state directory (two engines fork the receipts chain).
- Every innie is disclosed as synthetic, always.
- Never push to sail-money remotes; `0xRcap` is home.

## 9. What would prove this wrong (so it can fail)

1. **The soul premium is measurable or it isn't.** House-innie content with full soul
   (canon + memory + receipts visible) must outperform the same briefs voiced
   generically. If audiences can't tell, the soul thesis is decoration.
2. **Earliness must survive contact with clients.** If the per-client median Δ isn't
   hours, Layer 1 is not a moat for that scene and we say so.
3. **The boutique constraint must pay.** If curation produces no pricing power within
   the first cohort, boutique was a pose, not a model.

Scored in an AUDIT.md, HEAT-style, when the data exists.

---

*v1 — 2026-07-18. Companion docs: SOUL.md (Layer 0 spec) · HEAT's BRAND.md +
CULTURE.md (Layer 1, unchanged, still law in their own repo). Amendments are
commits, never vibes.*
