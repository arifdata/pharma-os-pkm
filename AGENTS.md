# AGENTS.md

## Stack

- **Frontend**: Svelte 5 (runes mode) + Vite + Tailwind CSS v4 + shadcn-svelte (lyra style, phosphor icons)
- **Backend**: PocketBase 0.38.2 (single binary, gitignored)
- **Package manager**: `bun`

## Commands (run in `frontend-svelte/`)

| Command | Purpose |
|---------|---------|
| `bun run dev` | Dev server (Vite) |
| `bun run build` | Build to `frontend-svelte/dist/` |
| `bun run check` | Typecheck (`svelte-check` + `tsc`) |

No test, lint, or CI scripts exist.

## Deploy flow

1. `bun run build` (inside `frontend-svelte/`)
2. Copy `frontend-svelte/dist/*` → `pb_public/`
3. Run `./pocketbase serve` at repo root

## Architecture quirks

- Pure SPA (no router library yet) — PocketBase serves `pb_public/` via `$apis.static()` in `pb_hooks/main.pb.js`
- Run migrations with `./pocketbase migrate` (collections defined in `pb_migrations/`)
- `pocketbase` binary is gitignored; download v0.38.2 from PocketBase releases if missing
- No `.env` — PocketBase uses default configuration, frontend has no env variables
- `pb_data/` is gitignored — contains the SQLite database and uploads
