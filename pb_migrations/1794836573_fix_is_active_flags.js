/// <reference path="../pb_data/types.d.ts" />

// Koreksi untuk 1794578916 (subunits) + 1794579022 (stok_subunit):
// 1. subunits.is_active salah ditandai required:true. PocketBase tidak punya
//    default untuk bool, dan required:bool berarti nilai harus true — sehingga
//    form/create biasa tanpa field ini akan ditolak validasi.
// 2. stok_subunit.is_active memakai field id yang sama dengan subunits.
//    Unikkan agar tidak ambigu saat edit koleksi / rollback.
migrate((app) => {
  // --- subunits: required -> optional ---
  const subunits = app.findCollectionByNameOrId("subunits")
  const subunitsField = subunits.fields.getByName("is_active")
  subunitsField.required = false
  app.save(subunits)

  // --- stok_subunit: field id unik ---
  const stokSubunit = app.findCollectionByNameOrId("stok_subunit")
  const stokField = stokSubunit.fields.getByName("is_active")
  stokField.id = "bool778166240"
  app.save(stokSubunit)

  // --- backfill: baris lama tetap aktif ---
  // (kolom bool tanpa default bernilai false untuk baris yang sudah ada)
  app.db().newQuery("UPDATE subunits SET is_active = TRUE").execute()
  app.db().newQuery("UPDATE stok_subunit SET is_active = TRUE").execute()
}, (app) => {
  const subunits = app.findCollectionByNameOrId("subunits")
  const subunitsField = subunits.fields.getByName("is_active")
  subunitsField.required = true
  app.save(subunits)

  const stokSubunit = app.findCollectionByNameOrId("stok_subunit")
  const stokField = stokSubunit.fields.getByName("is_active")
  stokField.id = "bool458715613"
  app.save(stokSubunit)
})