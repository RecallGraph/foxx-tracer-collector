'use strict'

const { db } = require('@arangodb')
const { SERVICE_COLLECTIONS, createReportCron } = require('../lib/helpers')

const { spans } = SERVICE_COLLECTIONS
const documentCollections = [spans]
const edgeCollections = []

for (const localName of documentCollections) {
  if (!db._collection(localName)) {
    db._createDocumentCollection(localName)
  } else { // noinspection JSUnresolvedVariable
    if (module.context.isProduction) {
      console.debug(
        `collection ${localName} already exists. Leaving it untouched.`
      )
    }
  }
}

for (const localName of edgeCollections) {
  if (!db._collection(localName)) {
    db._createEdgeCollection(localName)
  } else { // noinspection JSUnresolvedVariable
    if (module.context.isProduction) {
      console.debug(
        `collection ${localName} already exists. Leaving it untouched.`
      )
    }
  }
}

const spanColl = db._collection(SERVICE_COLLECTIONS.spans)
spanColl.ensureIndex({
  type: 'ttl',
  fields: ['dtime'],
  expireAfter: 0
})
spanColl.ensureIndex({
  type: 'persistent',
  fields: ['ctime'],
  unique: false
})
spanColl.ensureIndex({
  type: 'persistent',
  fields: ['data.context.trace_id'],
  unique: false,
  sparse: true
})

// Setup crons
createReportCron()

console.log('Finished setup.')
