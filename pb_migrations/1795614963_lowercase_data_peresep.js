/// <reference path="../pb_data/types.d.ts" />

// Normalisasi data_peresep.nama_peresep ke lowercase.
// Hook di pb_hooks/main.pb.js menjaga input baru; migrasi ini membereskan data lama.
migrate((app) => {
  // jangan `return` hasil execute(): nilainya bukan error dan goja gagal
  // mengonversinya ("could not convert [object Object] to error")
  app.db().newQuery("UPDATE data_peresep SET nama_peresep = LOWER(TRIM(nama_peresep)) WHERE nama_peresep <> LOWER(TRIM(nama_peresep))").execute()
}, (app) => {
  // lowercase tidak bisa dibalik (nilai asli hilang) -> down no-op
})
