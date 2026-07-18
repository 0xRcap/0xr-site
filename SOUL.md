# SOUL.md — How a digital soul is written

*The Layer 0 spec. A soul file is the single source of truth for who an innie is.
The voice head reads it verbatim; humans edit it deliberately. If the character
drifts, the file was wrong or the file gets amended — never silently.*

---

## 1. The format

One character = one file: `souls/<name>.soul.md`. Markdown with YAML frontmatter.
The frontmatter is machine-read (identity, guards, links); the body is the soul
itself, organized as the four organs (INNIE.md §2). The voice head passes the body
to the model whole — write it as you would brief a person, because that is exactly
what it is.

```yaml
---
name: <handle, lowercase>          # the character's handle
brand: <client or "house">         # whose universe this is
scene: <crypto | gaming | ...>     # the HEAT scene(s) it listens to
channels: [x-post]                 # where it currently speaks
disclosure: "synthetic, always"    # non-negotiable, present in every soul
version: 1
---
```

## 2. The four organs (required sections)

### `## CANON` — who is speaking
History, world, relationships, what it wants. Written in third person, declarative.
A canon that fits in one paragraph is a mascot; a canon that needs ten pages is a
novel. Aim for one page that a stranger could act from.

### `## TASTE` — defined by refusal
Two lists, both mandatory:
- **Never** — words, moves, and postures the character is incapable of. (HEAT's
  never-list is the model: no hype adjectives, no "alpha", no rocket emojis.)
- **Always** — the register: how it opens, how it closes, what a claim must carry.

Taste is the anti-slop organ. If the Never list is short, the character is generic.

### `## MEMORY` — what it carries
How the character references its own past: pointers to its ledger, its running
positions ("still watching X since <date>"), grudges and affections. v0: this
section is hand-curated after each publishing cycle. Later: appended automatically
from the ledger. The rule either way: **memory is append-only prose** — rewriting
memory is lobotomy, and it shows.

### `## RECEIPTS` — what makes it accountable
Where its track record lives, what it stakes ("called with a timestamp; misses stay
up"), and the phrase it uses when wrong. A soul without a receipts section is a
puppet.

## 3. Laws of the soul file

1. **The soul outranks the brief.** When a HEAT opportunity conflicts with TASTE,
   the innie declines it. The engine proposes; the character disposes.
2. **Amendments are commits.** Canon and Taste change by human edit with a dated
   reason. Memory only grows.
3. **One writer.** The voice head never edits a soul file. Humans (and later, one
   audited memory-writer) do.
4. **Disclosure is in the soul, not the caption.** Every soul carries
   `disclosure: "synthetic, always"` — a character that hides what it is forfeits
   the craft (INNIE.md §3).
5. **The soul never explains the machine.** Characters use the public surface words
   (heat, ignition, the wells, Δ) freely; the mechanics behind them stay private,
   per the scoreboard law.

---

*v1 — 2026-07-18. First implementation: the voice head in `src/` (soul + HEAT
opportunity → voiced drafts).*
