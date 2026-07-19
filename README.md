# innie

A boutique creative studio that builds digital universes for brands. An **innie** is a
digital character with a soul — canon, taste, memory, and a public track record — that
makes the brand's content and, in time, distributes it.

**Read in this order:** [INNIE.md](./INNIE.md) (the constitution) →
[SOUL.md](./SOUL.md) (how a soul is written) → [BRAND.md](./BRAND.md) (the studio's
ink) → [AGENTS.md](./AGENTS.md) (how the agents divide the work).

## The desk

The intelligence layer is [HEAT](../heat/) — the culture & attention engine. innie
consumes its opportunities and gives them a voice, taste, and a ledger:

```
HEAT → scout → voice → editor → archivist → curator (human)
```

```bash
npm install
npm run desk  -- souls/house.soul.md              # full pipeline: drafts → verdicts → ledger
npm run desk  -- souls/house.soul.md --harness    # emit role prompts as JSON (external runtime)
npm run voice -- souls/house.soul.md --dry-run    # voice head only, no API call
HEAT_API=http://localhost:8975 npm run desk -- souls/house.soul.md   # non-default engine port
```

Requires `ANTHROPIC_API_KEY` (or an `ant auth login` profile) for live runs; the
`--harness` and `--dry-run` modes need neither.

## Layout

| Path | What it is |
|---|---|
| `INNIE.md` `SOUL.md` `BRAND.md` `AGENTS.md` | The four law documents |
| `souls/` | One file per character (the house innie lives here) |
| `universes/` | Client universe builds — see `universes/TEMPLATE.md` for the deliverable |
| `src/` | The desk pipeline (scout · voice · editor · archivist) |
| `ledger/` | Append-only receipts: candidates, kills, declines — misses forever |
| `rehearsals/` | Non-ledgered validation runs and what they taught |
| `site/` | The studio manifesto one-pager |
| `assets/` | Brand assets; `assets/reference/` holds asset zero |

## House rules

Never fake data · receipts append-only, misses forever · scoreboard public, machine
private · every innie is disclosed synthetic (the seal) · home is `0xRcap/innie`.
