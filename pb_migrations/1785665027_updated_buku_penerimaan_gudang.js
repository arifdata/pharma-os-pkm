/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_740636071")

  // update collection data
  unmarshal({
    "name": "penerimaan_gudang"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_740636071")

  // update collection data
  unmarshal({
    "name": "buku_penerimaan_gudang"
  }, collection)

  return app.save(collection)
})
