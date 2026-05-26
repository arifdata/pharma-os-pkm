# Pharma-OS PKM Frontend

Aplikasi frontend untuk sistem manajemen inventaris obat dan BMHP (Bahan Medis Habis Pakai) Puskesmas.

## Tech Stack

- Svelte 5 (runes mode)
- Vite 8
- Carbon Components Svelte + Carbon Icons Svelte
- `svelte-spa-router`
- PocketBase JS SDK

## Perintah

| Perintah | Kegunaan |
|----------|----------|
| `bun run dev` | Dev server (Vite, HMR) |
| `bun run build` | Build ke `dist/` |
| `bun run check` | Typecheck (`svelte-check` + `tsc`) |

Tidak ada skrip test, lint, atau CI.

## Notes

- Gunakan relative imports (tidak ada path alias `$lib`)
- Tema Carbon dikendalikan via atribut `theme` pada elemen `<html>`
- `svelte-spa-router` sudah terinstal, belum dipasang di `App.svelte`
