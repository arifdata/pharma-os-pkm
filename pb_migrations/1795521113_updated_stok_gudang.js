/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_703122306")

  // add field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "bool734128506",
    "name": "is_active",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  app.save(collection)

  // backfill: baris lama tetap aktif
  // (kolom bool tanpa default bernilai false untuk baris yang sudah ada)
  // jangan `return` hasil execute(): nilainya bukan error dan goja gagal
  // mengonversinya ("could not convert [object Object] to error")
  app.db().newQuery("UPDATE stok_gudang SET is_active = TRUE").execute()
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_703122306")

  // remove field
  collection.fields.removeById("bool734128506")

  return app.save(collection)
})
