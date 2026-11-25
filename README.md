# Pharma-OS PKM

Sistem manajemen inventaris obat dan BMHP (Bahan Medis Habis Pakai) untuk Puskesmas.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | Svelte 5 (runes) + Vite 8 + Carbon Components Svelte + Carbon Icons Svelte |
| **Backend** | PocketBase 0.42.3 (single binary, SQLite) |
| **Router** | `svelte-spa-router` (hash-based, `#/path`) |
| **Package Manager** | `bun` |

## Prerequisites

- [bun](https://bun.sh) >= 1.2
- Binary [PocketBase](https://github.com/pocketbase/pocketbase/releases) v0.42.3 di root project (gitignored; versi di-pin di `pb_version.txt`)

## Backend Setup

```bash
# 1. Install frontend dependencies
cd frontend-svelte
bun install
cd ..

# 2. Download PocketBase v0.42.3
#    Letakkan binary `pocketbase` di root project

# 3. Jalankan migrasi database (juga auto-apply saat serve)
./pocketbase migrate

# 4. Buat akun superuser
./pocketbase superuser upsert admin@contoh.local passwordku

# 5. Jalankan server (API + static pb_public)
./pocketbase serve
```

Akses aplikasi di `http://localhost:8090` dan login memakai akun **superuser**
(koleksi `_superusers`, bukan collection user biasa).

## Frontend Development

Semua perintah dijalankan dari direktori `frontend-svelte/`:

| Perintah | Kegunaan |
|----------|----------|
| `bun run dev` | Dev server Vite (HMR) |
| `bun run build` | Build ke `frontend-svelte/dist/` |
| `bun run check` | Typecheck (`svelte-check` + `tsc`, dua tsconfig) |

Tidak ada skrip test, lint, atau CI.

## Modul

### Pendaftaran

| Route | Halaman | Koleksi |
|-------|---------|---------|
| `#/data_pasien` | CRUD pasien (no. kartu, nama, alamat, tanggal lahir, no. telepon) + kolom umur terhitung | `data_pasien` |
| `#/data_peresep` | CRUD nama peresep | `data_peresep` |
| `#/data_diagnosa` | CRUD nama diagnosa | `data_diagnosa` |

### Farmasi

| Route | Halaman | Koleksi |
|-------|---------|---------|
| `#/penerimaan_gudang` | Daftar penerimaan gudang | `penerimaan_gudang` |
| `#/penerimaan_gudang/add` | Input buku penerimaan | `penerimaan_gudang`, `penerimaan_gudang_items` |
| `#/penerimaan_gudang/:id` | Detail penerimaan | `penerimaan_gudang_items` |
| `#/stok_gudang` | Stok gudang aktif | `stok_gudang` |
| `#/distribusi_gudang` | Distribusi stok ke subunit | `distribusi_item_gudang`, `stok_subunit` |
| `#/masterbmhp` | Master BMHP + label | `master_bmhp`, `master_bmhp_labels` |
| `#/subunit` | CRUD subunit | `subunits` |

## Konvensi Data

Kapitalisasi nilai teks berbeda per koleksi — jangan diseragamkan:

| Koleksi | Field | Aturan simpan | Tampilan tabel |
|---------|-------|---------------|----------------|
| `data_pasien` | `nomor_kartu`, `nama_pasien`, `alamat`, `nomor_telepon` | lowercase (trim) | `nama_pasien` + `alamat` uppercase |
| `data_peresep` | `nama_peresep` | lowercase (trim) | uppercase |
| `data_diagnosa` | `nama_diagnosa` | apa adanya (sesuai input) | apa adanya |
| `penerimaan_gudang_items` | `no_batch` | lowercase (trim) | — |

Aturan lowercase dijaga dua lapis: validasi Zod di frontend (`.trim().toLowerCase()`)
dan record hook di `pb_hooks/main.pb.js` (kena juga `$app.save`). Data lama
dinormalisasi lewat migrasi `*_lowercase_*.js`.

## Struktur Proyek

```
frontend-svelte/src/
  App.svelte            # Header, SideNav, tema, router
  routes.js             # Route registry (hash path -> komponen)
  routes/
    pendaftaran/        # Halaman modul pendaftaran
    farmasi/            # Halaman modul farmasi
  pb/client.svelte.ts   # Instance PocketBase + state auth
  lib/notif.svelte.ts   # Notification queue
  validation-schema.ts  # Skema Zod per form
pb_hooks/main.pb.js     # Hook record + static file pb_public
pb_migrations/          # Definisi koleksi & migrasi data
pb_public/              # Hasil build frontend yang disajikan PocketBase
```

Catatan pengembangan:

- SPA murni: PocketBase menyajikan `pb_public/` lewat `$apis.static()` di `pb_hooks/main.pb.js`;
  frontend memanggil PocketBase langsung ke `http://localhost:8090` (tanpa proxy Vite).
- Semua rule koleksi `null` (deny all) — operasi DB hanya berhasil saat login superuser.
- State module pakai suffiks `.svelte.ts` (runes), bukan `.ts`.
- Tidak ada alias `$lib`; gunakan relative import.
- Handler hook berjalan di VM goja terpisah — helper wajib dideklarasikan di dalam handler.

## Deploy

```bash
# 1. Build frontend
cd frontend-svelte && bun run build
cd ..

# 2. Copy hasil build ke pb_public/
cp -r frontend-svelte/dist/* pb_public/

# 3. Jalankan PocketBase
./pocketbase serve
```
