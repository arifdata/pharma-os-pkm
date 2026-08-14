/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4261532994")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_740636071",
    "help": "",
    "hidden": false,
    "id": "relation697853270",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "penerimaan_gudang",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4261532994")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_740636071",
    "help": "",
    "hidden": false,
    "id": "relation697853270",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "penerimaan_gudang",
    "presentable": true,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
