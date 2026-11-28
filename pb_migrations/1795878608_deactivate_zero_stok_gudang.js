/// <reference path="../pb_data/types.d.ts" />

// Stok gudang dengan jumlah <= 0 seharusnya nonaktif.
// Hook di pb_hooks/main.pb.js menjaga perubahan baru; migrasi ini membereskan data lama.
migrate((app) => {
  // jangan `return` hasil execute(): nilainya bukan error dan goja gagal
  // mengonversinya ("could not convert [object Object] to error")
  app.db().newQuery("UPDATE stok_gudang SET is_active = false WHERE jumlah <= 0 AND is_active = true").execute()
}, (app) => {
  // status aktif asli tidak diketahui -> down no-op
})
