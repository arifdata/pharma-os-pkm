/// <reference path="../pb_data/types.d.ts" />

// Normalisasi no_batch ke lowercase (aturan: semua nomor batch disimpan lowercase).
// Hook di pb_hooks/main.pb.js menjaga input baru; migrasi ini membereskan data lama.
migrate((app) => {
  // jangan `return` hasil execute(): nilainya bukan error dan goja gagal
  // mengonversinya ("could not convert [object Object] to error")
  app.db().newQuery("UPDATE penerimaan_gudang_items SET no_batch = LOWER(TRIM(no_batch)) WHERE no_batch <> LOWER(TRIM(no_batch))").execute()

  // stok_gudang yang sudah ada tetap aktif
  app.db().newQuery("UPDATE stok_gudang SET is_active = TRUE WHERE is_active IS NOT TRUE").execute()
}, (app) => {
  // lowercase tidak bisa dibalik (nilai asli hilang) -> down no-op
})
