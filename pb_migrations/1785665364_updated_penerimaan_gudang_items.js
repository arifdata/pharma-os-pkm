/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4261532994")

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_628162748",
    "help": "",
    "hidden": false,
    "id": "relation3050373649",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "labels",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4261532994")

  // remove field
  collection.fields.removeById("relation3050373649")

  return app.save(collection)
})
