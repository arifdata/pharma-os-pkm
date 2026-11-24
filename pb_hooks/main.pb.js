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

/**
 * Distribusi gudang (satu request = satu baris distribusi_item_gudang):
 * 1. potong jumlah pada stok_gudang aktif milik item tersebut
 * 2. catat distribusi_item_gudang
 * 3. bila subunit tujuan is_active = true, catat baris baru di stok_subunit
 *    (is_active = true, satu baris per distribusi — sama seperti stok_gudang)
 */
onRecordCreateRequest((e) => {
  const record = e.record
  const itemId = record.get("item")
  const jumlah = record.get("jumlah") || 0

  if (!(jumlah > 0)) {
    throw new BadRequestError("Jumlah distribusi harus lebih dari 0.")
  }

  let stok = null
  try {
    stok = $app.findFirstRecordByFilter(
      "stok_gudang",
      "is_active = true && item = {:item}",
      { item: itemId }
    )
  } catch (err) {
    stok = null
  }
  if (!stok) {
    throw new BadRequestError("Stok gudang aktif untuk item ini tidak ditemukan.")
  }

  const tersedia = stok.get("jumlah") || 0
  if (jumlah > tersedia) {
    throw new BadRequestError(`Jumlah melebihi stok tersedia (${tersedia}).`)
  }

  stok.set("jumlah", tersedia - jumlah)
  $app.save(stok)

  e.next()

  // stok_subunit hanya dicatat bila subunit tujuan aktif
  let subunit = null
  try {
    subunit = $app.findRecordById("subunits", record.get("tujuan"))
  } catch (err) {
    subunit = null
  }
  if (subunit && subunit.get("is_active") === true) {
    const stokSubunit = new Record($app.findCollectionByNameOrId("stok_subunit"))
    stokSubunit.set("subunit", subunit.id)
    stokSubunit.set("item", itemId)
    stokSubunit.set("jumlah", jumlah)
    stokSubunit.set("is_active", true)
    $app.save(stokSubunit)
  }
}, "distribusi_item_gudang")
