# AGENTS.md

## Stack

- **Frontend**: Svelte 5 (runes mode) + Vite 8 + Carbon Components Svelte + Carbon Icons Svelte
- **Backend**: PocketBase 0.39.9 (binary tunggal, gitignored; SQLite di `pb_data/`)
- **Router**: `svelte-spa-router` (hash-based, `#/path`) — sudah terpasang & dipasang di `App.svelte`
- **Package manager**: `bun`

## Perintah (jalankan di `frontend-svelte/`)

| Perintah | Kegunaan |
|----------|----------|
| `bun run dev` | Dev server (Vite, HMR) |
| `bun run build` | Build ke `frontend-svelte/dist/` |
| `bun run check` | Typecheck (`svelte-check` + `tsc` — dua tsconfig) |

Tidak ada skrip test, lint, atau CI.

## Arsitektur

- SPA murni — PocketBase serving `pb_public/` via `$apis.static()` di `pb_hooks/main.pb.js`
- Frontend butuh PocketBase jalan — `src/pb/client.svelte.ts` hardcode `http://localhost:8090`; Vite tanpa proxy, akses PB langsung
- Login pakai koleksi **`_superusers`** (akun superuser), bukan collection user biasa
- Semua rule koleksi `null` (deny all) — operasi DB hanya berhasil saat login superuser
- State module pakai suffix `.svelte.ts` (mis. `pb/client.svelte.ts`, `lib/notif.svelte.ts`) — jangan pakai `.ts` biasa untuk state runes
- Route registry di `src/routes.js`; halaman per domain di `src/routes/<domain>/<Nama>Page.svelte` (mis. `routes/farmasi/MasterBMHPPage.svelte`)
- Route gating: SideNav & halaman cek `auth.isLoggedIn`; menu terkunci buka modal login
- Tidak ada path alias `$lib` di tsconfig; gunakan relative imports
- Tema Carbon dikendalikan atribut `theme` di `<html>` (`g10`=terang, `g90`=gelap); toggle di `App.svelte`

## Migrasi

- Koleksi didefinisikan di `pb_migrations/*.js`; auto-apply saat `./pocketbase serve`, bisa manual dengan `./pocketbase migrate`
- Migrasi baru dibuat dengan rule `null` (deny all) — akses via client pakai superuser

## Deploy

1. `cd frontend-svelte && bun run build`
2. `cp -r frontend-svelte/dist/* pb_public/`
3. `./pocketbase serve` (di root repo)
