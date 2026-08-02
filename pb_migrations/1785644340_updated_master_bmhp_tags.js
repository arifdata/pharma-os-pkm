/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4114745677")

  // update collection data
  unmarshal({
    "name": "master_bmhp_labels"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4114745677")

  // update collection data
  unmarshal({
    "name": "master_bmhp_tags"
  }, collection)

  return app.save(collection)
})
