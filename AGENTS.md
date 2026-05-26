# AGENTS.md

## Stack

- **Frontend**: Svelte 5 (runes mode) + Vite 8 + Carbon Components Svelte + Carbon Icons Svelte
- **Backend**: PocketBase 0.38.2 (binary tunggal, gitignored)
- **Router**: `svelte-spa-router` (terinstal, belum dipasang)
- **Package manager**: `bun`

## Perintah (jalankan di `frontend-svelte/`)

| Perintah | Kegunaan |
|----------|----------|
| `bun run dev` | Dev server (Vite) |
| `bun run build` | Build ke `frontend-svelte/dist/` |
| `bun run check` | Typecheck (`svelte-check` + `tsc`) |

Tidak ada skrip test, lint, atau CI.

## Arsitektur

- SPA murni — PocketBase serving `pb_public/` via `$apis.static()` di `pb_hooks/main.pb.js`
- Jalankan migrasi dengan `./pocketbase migrate` (koleksi didefinisikan di `pb_migrations/`)
- Binary `pocketbase` gitignored; unduh v0.38.2 dari rilis PocketBase jika belum ada
- Tidak ada `.env` — PocketBase menggunakan konfigurasi default, frontend tanpa variabel env
- `pb_data/` gitignored — berisi database SQLite dan file upload
- Tidak ada path alias `$lib` di tsconfig; gunakan relative imports
- Tema Carbon dikendalikan oleh atribut `theme` di `<html>` (`g10`=terang, `g90`=gelap)

## Deploy

1. `cd frontend-svelte && bun run build`
2. `cp -r frontend-svelte/dist/* pb_public/`
3. `./pocketbase serve` (di root repo)
