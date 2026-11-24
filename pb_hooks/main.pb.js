/// <reference path="../pb_data/types.d.ts" />

routerAdd("GET", "/{path...}", $apis.static(`${__hooks}/../pb_public`, false))

// Catatan: setiap handler hook dieksekusi di VM goja terpisah, jadi helper
// tidak bisa didefinisikan di scope file — harus di dalam handler masing-masing.

/**
 * no_batch selalu disimpan lowercase (trim dulu), termasuk untuk save internal
 * ($app.save). Model hook dipakai supaya semua jalur tulis kena.
 */
onRecordCreate((e) => {
  const lower = (v) => (v === null || v === undefined ? "" : String(v).trim().toLowerCase())
  e.record.set("no_batch", lower(e.record.get("no_batch")))
  e.next()
}, "penerimaan_gudang_items")

onRecordUpdate((e) => {
  const lower = (v) => (v === null || v === undefined ? "" : String(v).trim().toLowerCase())
  e.record.set("no_batch", lower(e.record.get("no_batch")))
  e.next()
}, "penerimaan_gudang_items")

/**
 * Setiap item penerimaan gudang = satu baris stok_gudang baru, dan baris baru
 * selalu is_active = true. Tidak ada penggabungan jumlah, walau no_batch sama.
 */
onRecordCreate((e) => {
  e.record.set("is_active", true)
  e.next()
}, "stok_gudang")
