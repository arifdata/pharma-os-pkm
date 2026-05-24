# TODO — Pharma-OS PKM

> Status: Backend schema siap. Frontend masih boilerplate. Fokus utama: cleanup → layout & routing → PB SDK → fitur modul.

---

## 1. Frontend Cleanup (Hapus Boilerplate)

- [ ] Hapus `src/lib/Counter.svelte`
- [ ] Hapus asset default: `src/assets/hero.png`, `src/assets/svelte.svg`, `src/assets/vite.svg`
- [ ] Hapus file `src/lib/components/ui/button/button.svelte` jika masih unused (atau keep kalau sudah dipakai)
- [ ] Bersihkan `src/App.svelte` — hapus semua section default Vite (hero, "Get started", "Documentation", "Connect with us", ticks, spacer)
- [ ] Bersihkan `src/app.css`:
  - Hapus styling boilerplate (`#center`, `#next-steps`, `#docs`, `#social`, `#spacer`, `.ticks`, `.hero`, `.counter`, `code`, dsb)
  - Pertahankan hanya: `@import` tailwind, `@theme inline`, `:root` variabel shadcn, `@layer base`, dark mode, dan font setup
- [ ] Ganti `index.html` title dari default menjadi "Pharma-OS PKM"

---

## 2. Arsitektur Frontend (Struktur & Routing)

- [ ] Tentukan mekanisme routing:
  - **Opsi A**: Install `svelte-spa-router` (hash-based, simple)
  - **Opsi B**: Install `@tanstack/svelte-router` (type-safe, modern)
  - **Opsi C**: Custom hash router sederhana tanpa dependency (cukup untuk MVP)
- [ ] Buat folder structure:
  ```
  src/
  ├── routes/                 # Page components
  │   ├── Dashboard.svelte
  │   ├── MasterBMHP.svelte
  │   ├── Penerimaan.svelte
  │   ├── Stok.svelte
  │   ├── Resep.svelte
  │   └── Login.svelte
  ├── lib/
  │   ├── components/
  │   │   └── ui/             # shadcn-svelte components
  │   ├── stores/             # Svelte 5 runes-based stores
  │   │   └── auth.svelte.ts
  │   ├── pocketbase.ts       # PB client singleton
  │   └── utils.ts
  ├── App.svelte              # Router outlet + layout
  ├── main.ts
  └── app.css
  ```
- [ ] Buat layout utama: sidebar kiri (navigation) + topbar (user info, logout) + content area

---

## 3. Integrasi PocketBase SDK

- [ ] Install `pocketbase` npm package: `bun add pocketbase`
- [ ] Buat `src/lib/pocketbase.ts` — singleton client, auto-init dari `window.location.origin`
- [ ] Buat auth store (`src/lib/stores/auth.svelte.ts`) menggunakan Svelte 5 runes:
  - `isAuthenticated: boolean`
  - `user: User | null`
  - `login(email, password)`
  - `logout()`
  - `register(email, password, passwordConfirm, name)`
  - `refresh()`
- [ ] Implementasi auth persistence menggunakan `pb.authStore.onChange` dan `localStorage`
- [ ] Pastikan token refresh handled otomatis oleh PB SDK

---

## 4. Auth Flow

- [ ] Buat halaman `Login.svelte`:
  - Form email + password
  - Error handling (invalid credentials, network error)
  - Redirect ke dashboard setelah login sukses
- [ ] Buat route guard: redirect ke `/login` jika tidak authenticated
- [ ] Tombol logout di layout/topbar
- [ ] (Opsional) Register page untuk user baru (jika diperlukan, atau biarkan admin buat via PocketBase Admin UI)

---

## 5. PocketBase API Rules (Kritis!)

Semua collections non-auth saat ini memiliki semua rules = `null` (hanya superuser bisa akses). **WAJIB diatur** sebelum aplikasi bisa digunakan.

- [ ] Tentukan role/permission model (contoh: semua user authenticated bisa CRUD, atau tiered access)
- [ ] Update rules untuk collections:
  - `master_bmhp` / `master_bmhp_satuan` / `master_bmhp_kategori`
  - `penerimaan_gudang` / `penerimaan_gudang_item` / `penerimaan_gudang_sumber`
  - `stok_gudang` / `stok_subunit` / `kartu_stok_gudang` / `kartu_stok_subunit`
  - `subunit_pkm`
  - `data_pasien` / `data_diagnosa` / `data_peresep` / `data_resep`
- [ ] Aturan awal yang aman untuk development:
  - `createRule`, `updateRule`, `deleteRule`, `listRule`, `viewRule`: `@request.auth.id != ''`
  - (Artinya: semua user yang login bisa akses semua data. Sesuaikan nanti untuk production.)
- [ ] Generate migration baru setelah update rules: `./pocketbase migrate create "update_api_rules"`

---

## 6. Fitur Modul (Halaman)

### 6a. Dashboard
- [ ] Ringkasan stok (total item, item mendekati kadaluarsa, stok rendah)
- [ ] Statistik resep hari ini / minggu ini
- [ ] Quick links ke modul utama

### 6b. Master Data BMHP
- [ ] CRUD `master_bmhp` (nama, satuan, kategori[])
- [ ] CRUD `master_bmhp_satuan`
- [ ] CRUD `master_bmhp_kategori`
- [ ] Relasi: dropdown satuan & multi-select kategori saat create/edit BMHP

### 6c. Penerimaan Gudang
- [ ] List penerimaan dengan filter tanggal
- [ ] Form penerimaan baru (header: tanggal, nomor dokumen, sumber, lampiran, keterangan)
- [ ] Detail/inline edit items BMHP per penerimaan (jumlah, nomor batch, harga satuan, tgl kadaluarsa)
- [ ] Saat simpan penerimaan + items, otomatis update `stok_gudang` dan buat record `kartu_stok_gudang`

### 6d. Stok & Distribusi
- [ ] Tabel `stok_gudang` (sisa stok per BMHP per batch)
- [ ] Form distribusi dari gudang ke subunit:
  - Pilih BMHP & batch (dari stok gudang yang masih ada)
  - Pilih subunit tujuan
  - Input jumlah keluar
  - Saat simpan: kurangi `stok_gudang`, tambah `stok_subunit`, catat `kartu_stok_gudang` (keluar) dan `kartu_stok_subunit` (masuk)
- [ ] Tabel `stok_subunit`
- [ ] Kartu stok (history masuk/keluar) untuk gudang dan per subunit

### 6e. Resep & Pasien
- [ ] CRUD `data_pasien`
- [ ] CRUD `data_diagnosa`
- [ ] CRUD `data_peresep`
- [ ] Form resep baru:
  - Pilih pasien (atau daftar pasien baru inline)
  - Pilih peresep
  - Pilih diagnosa[] (multi)
  - Input item resep (BMHP dari stok subunit, jumlah)
  - Saat simpan: kurangi `stok_subunit`, catat `kartu_stok_subunit` (keluar), simpan `data_resep` dengan `resep` JSON

---

## 7. SPA Fallback Routing (Deploy)

- [ ] Update `pb_hooks/main.pb.js` agar menangani SPA fallback:
  - Route `GET /{path...}` harus serve `pb_public/index.html` untuk unknown paths (bukan 404)
  - Pastikan static assets (JS, CSS, images) tetap di-serve langsung
- [ ] Test deploy flow end-to-end:
  1. `cd frontend-svelte && bun run build`
  2. `cp -r frontend-svelte/dist/* pb_public/`
  3. `./pocketbase serve`
  4. Navigasi manual ke `/master-bmhp` harus tetap render halaman (bukan 404)

---

## 8. Design System & UI Polish

- [ ] Definisikan color palette yang konsisten (sudah ada di `app.css` via oklch — pertahankan)
- [ ] Pastikan dark mode toggle berfungsi (saat ini hanya `prefers-color-scheme`, belum manual toggle)
- [ ] Setup toast/notification system untuk feedback operasi (CRUD sukses/gagal)
- [ ] Loading states (skeleton atau spinner) untuk semua halaman yang fetch data
- [ ] Error boundaries / fallback UI untuk fetch failures
- [ ] Form validation menggunakan HTML5 native + custom logic (jangan hanya andalkan PB server-side validation)

---

## 9. Testing & Quality

- [ ] Jalankan `bun run check` secara rutin — tidak ada error TypeScript/Svelte
- [ ] Type safety untuk PB collections: generate TypeScript types dari schema (bisa pakai `pocketbase-typegen` atau manual interfaces)
- [ ] (Opsional) Coba build production (`bun run build`) sebelum setiap push untuk memastikan tidak ada build error

---

## 10. Finalisasi & Dokumentasi

- [ ] Update `AGENTS.md` jika ada perubahan tooling, path, atau command
- [ ] Update `README.md` dengan panduan penggunaan aplikasi yang lebih detail (cara login, alur penerimaan → distribusi → resep)
- [ ] Pastikan `TODO.md` di-update/arsipkan saat sebagian besar task selesai

---

## Checklist Pre-Production

- [ ] Semua API rules sudah diatur (tidak ada `null` di non-auth collections)
- [ ] Build berhasil tanpa error (`bun run build` lulus)
- [ ] Type check bersih (`bun run check` lulus)
- [ ] Semua route SPA fallback berfungsi setelah deploy
- [ ] Data dummy sudah di-seed untuk demo/testing
- [ ] Backup flow `pb_data/` sudah di-dokumentasikan
