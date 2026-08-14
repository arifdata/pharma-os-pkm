/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4261532994")

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3590399593",
    "help": "",
    "hidden": false,
    "id": "relation3512905749",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "nama_bmhp",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4261532994")

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3590399593",
    "help": "",
    "hidden": false,
    "id": "relation3512905749",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "nama_bmhp",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
