# 0xr-site

The source of **0xr.io** — the 0xR site, and nothing else. Site files live at the repo
root; Vercel deploys this repo directly.

- `npm run posts` — compiles `media/posts.json` into the data files the pages fetch.
- `scripts/cards.sh` — renders the per-page share cards into `media/`.
- `scripts/publish.sh` — TRANSITIONAL: copies to the retiring `0xr-site-old` repo, which
  still feeds Vercel until the project is repointed here. Dies with that repo.
- `SITE.md` — the handoff note: pages, the argument, what is settled, what needs a ruling.

No personal data lives here: the CV pages moved to the private personal repo on
2026-09-22, and this repo's history begins after that move.
