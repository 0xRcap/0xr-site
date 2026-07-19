# AGENTS.md — How innie's agents divide the work

*The Layer 0–3 runtime, from first principles. Companion to INNIE.md (why) and
SOUL.md (who). This document answers: why separate agents at all, which roles
exist, and what each is allowed to touch.*

---

## 1. First principles — why agents, not one big prompt

Four reasons, each load-bearing. If a proposed agent doesn't serve one of these,
it shouldn't exist.

1. **A soul must not grade its own work.** The voice that writes in character
   cannot also enforce taste — a model critiquing its own fresh draft, inside the
   same context, is systematically generous to it. Honest judgment requires a
   separate context that never felt the excitement of writing. This is HEAT's
   corroboration law transposed: one witness is noise; the echo is the signal.
2. **Different jobs want different context shapes.** The scout needs the whole
   desk and no depth. The voice needs one soul and one opportunity, deeply. The
   editor needs the TASTE organ and the drafts — and deliberately *not* the
   opportunity's excitement, so it judges the words, not the story. Stuffing all
   of that into one context makes every job worse at once.
3. **Least privilege keeps the constitution mechanical.** SOUL.md's laws ("the
   voice head never edits a soul", "receipts are append-only") should be enforced
   by *who holds the pen*, not by hoping a prompt is obeyed. Only the archivist
   writes the ledger. Nobody writes the soul. Agent boundaries turn law into
   architecture.
4. **Innies scale horizontally.** Each client innie is an independent pipeline —
   same roles, different soul. N clients = N pipelines sharing one perception
   layer (HEAT). The studio grows by adding souls, not by growing a monolith.

And the governing principle for orchestration:

> **Pipeline, not committee.** Control flow is deterministic code; the model works
> only *inside* a role. Agents never negotiate with each other in free text —
> data flows one direction through typed hand-offs. Committees produce vibes;
> pipelines produce receipts.

## 2. The roles (v0 — running today)

```
HEAT (:8972|:8975 /api/briefs)
   │
   ▼
THE SCOUT ──── pure code, no model. Filters the desk to this innie's scenes,
   │           ranks by heat × remaining window, hands over at most K.
   │           May read everything; may write nothing.
   ▼
THE VOICE ──── model, in character. One soul + one opportunity → 3 variants,
   │           or one line: "DECLINED: <taste reason>". The soul outranks the
   │           brief (SOUL.md law 1). Never sees the ledger, never edits the soul.
   ▼
THE EDITOR ─── model, out of character. Sees ONLY the soul's TASTE organ and the
   │           bare drafts — not the opportunity, not the excitement. Verdict per
   │           draft: PASS or KILL with the violated rule named. Adversarial by
   │           charter: instructed to look for reasons to kill.
   ▼
THE ARCHIVIST ─ pure code, no model. Appends every draft + verdict + timestamps
   │            to ledger/YYYY-MM-DD.jsonl. The ONLY writer. Append-only, misses
   │            and kills kept forever — the studio's own uncurated ledger.
   ▼
THE CURATOR ─── human. Rodrigo picks what ships. Nothing publishes without the
                curator in v0; autonomy is earned with ledger history, never
                assumed.
```

Two roles are deliberately **not** models: the scout (ranking is arithmetic) and
the archivist (writing a file needs no intelligence). First principle: never spend
a model where code suffices — every model call is a place the system can drift.

## 3. What each role may touch

| Role | Reads | Writes | Model? |
|---|---|---|---|
| Scout | HEAT API | — | no |
| Voice | soul file (whole), one opportunity | — | yes |
| Editor | soul's TASTE organ only, drafts | — | yes |
| Archivist | pipeline output | `ledger/*.jsonl` (append) | no |
| Curator | ledger | the outside world | human |

Nothing writes the soul. Memory updates are a human act after each publishing
cycle (SOUL.md), until a dedicated, audited memory-writer earns the pen.

## 4. Roles that come later (and what must be true first)

- **THE AESTHETE** (Layer 2): turns a passed draft into visual direction — panel,
  palette, motion — against the universe's bible. Comes when the first universe
  bible beyond BRAND.md exists.
- **THE COURIER** (Layer 4): places work on channels, learns timing from
  outcomes. Comes only after weeks of curator-shipped history — distribution
  autonomy is the *last* thing granted, not the first.
- **THE SCORER**: closes the loop — reads outcomes back into the ledger
  (traveled / died), the studio's Δ. Comes when there is published work to score.

## 5. Failure discipline

- A role that errors drops its item; the pipeline continues with the rest. No
  retries-until-it-agrees — a draft that can't pass the editor twice is a kill,
  recorded as a kill.
- Every kill and every decline is ledgered with its reason. The pipeline's
  misses are as visible as its hits — that's the house rule doing its job.

---

*v1 — 2026-07-19. Implementation: `src/agents/` + `src/pipeline.ts`. The runtime
is the Anthropic API (claude-opus-4-8) when a key is present; the same pipeline
can be driven by any harness that respects the hand-off types.*
