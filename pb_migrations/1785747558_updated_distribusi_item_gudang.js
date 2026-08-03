/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2738271472")

  // add field
  collection.fields.addAt(1, new Field({
    "help": "",
    "hidden": false,
    "id": "date1587159408",
    "max": "",
    "min": "",
    "name": "tanggal_distribusi",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2738271472")

  // remove field
  collection.fields.removeById("date1587159408")

  return app.save(collection)
})
