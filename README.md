# Pharma-OS PKM

Sistem manajemen inventaris obat dan BMHP (Bahan Medis Habis Pakai) untuk Puskesmas.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Svelte 5 (runes) + Vite 8 + Carbon Components Svelte + Carbon Icons Svelte |
| **Backend** | PocketBase 0.39.9 (single binary, SQLite) |
| **Router** | `svelte-spa-router` |
| **Package Manager** | `bun` |

## Prerequisites

- [bun](https://bun.sh) >= 1.2
- [PocketBase](https://github.com/pocketbase/pocketbase/releases/tag/v0.38.2) v0.39.9 binary di root project (gitignored)

## Backend Setup 

```bash
# 1. Install frontend dependencies
cd frontend-svelte
bun install

# 2. Download PocketBase v0.39.9
#    Letakkan binary `pocketbase` di root project

# 3. Jalankan migrasi database
./pocketbase migrate

# 4. Jalankan dev server (Vite)
./pocketbase serve
```

## Frontend Development

Semua perintah dijalankan dari direktori `frontend-svelte/`:

| Perintah | Kegunaan |
|----------|----------|
| `bun run dev` | Dev server Vite (HMR) |
| `bun run build` | Build ke `frontend-svelte/dist/` |
| `bun run check` | Typecheck (`svelte-check` + `tsc`) |

## Deploy

```bash
# 1. Build frontend
cd frontend-svelte && bun run build

# 2. Copy hasil build ke pb_public/
cp -r frontend-svelte/dist/* pb_public/

# 3. Jalankan PocketBase
./pocketbase serve
```
