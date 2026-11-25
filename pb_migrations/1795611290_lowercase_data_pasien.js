/// <reference path="../pb_data/types.d.ts" />

// Normalisasi data_pasien ke lowercase:
// nomor_kartu, nama_pasien, alamat, nomor_telepon.
// Hook di pb_hooks/main.pb.js menjaga input baru; migrasi ini membereskan data lama.
migrate((app) => {
  // jangan `return` hasil execute(): nilainya bukan error dan goja gagal
  // mengonversinya ("could not convert [object Object] to error")
  app.db().newQuery("UPDATE data_pasien SET nomor_kartu = LOWER(TRIM(nomor_kartu)) WHERE nomor_kartu <> LOWER(TRIM(nomor_kartu))").execute()
  app.db().newQuery("UPDATE data_pasien SET nama_pasien = LOWER(TRIM(nama_pasien)) WHERE nama_pasien <> LOWER(TRIM(nama_pasien))").execute()
  app.db().newQuery("UPDATE data_pasien SET alamat = LOWER(TRIM(alamat)) WHERE alamat <> LOWER(TRIM(alamat))").execute()
  app.db().newQuery("UPDATE data_pasien SET nomor_telepon = LOWER(TRIM(nomor_telepon)) WHERE nomor_telepon <> LOWER(TRIM(nomor_telepon))").execute()
}, (app) => {
  // lowercase tidak bisa dibalik (nilai asli hilang) -> down no-op
})
