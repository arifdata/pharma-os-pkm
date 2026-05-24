# AGENTS.md

## Stack

- **Frontend**: SvelteKit 5 (runes mode, SPA) + Tailwind CSS v4 + shadcn-svelte (mira, tabler icons)
- **Backend**: PocketBase 0.38.2 (single binary, gitignored)
- **Package manager**: `bun`

## Commands (run in `frontend/`)

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server |
| `bun run build` | Build to `frontend/build/` |
| `bun run check` | Typecheck via svelte-check |

No test, lint, or CI scripts exist.

## Deploy flow

1. `bun run build` (inside `frontend/`)
2. Copy `frontend/build/*` → `pb_public/`
3. Run `./pocketbase serve` at repo root

## Architecture quirks

- Hash router (`router: { type: 'hash' }`) + static adapter with `fallback: 'index.html'` — pure SPA served by PocketBase
- PocketBase serves `pb_public/` via `$apis.static()` in `pb_hooks/main.pb.js`
- Run migrations with `./pocketbase migrate` (collections defined in `pb_migrations/`)
- `pocketbase` binary is gitignored; download v0.38.2 from PocketBase releases if missing
- No `.env` — PocketBase uses default configuration, frontend has no env variables

## Response

- Put emoticons in every response. I like Emoticons.
