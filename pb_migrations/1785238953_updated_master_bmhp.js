/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3590399593")

  // update field
  collection.fields.addAt(2, new Field({
    "help": "",
    "hidden": false,
    "id": "json3357413904",
    "maxSize": 0,
    "name": "tags",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3590399593")

  // update field
  collection.fields.addAt(2, new Field({
    "help": "",
    "hidden": false,
    "id": "json3357413904",
    "maxSize": 0,
    "name": "kategori",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
})
