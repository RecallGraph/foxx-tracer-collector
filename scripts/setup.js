'use strict'

const { db } = require('@arangodb')
const { SERVICE_COLLECTIONS } = require('../lib/helpers')

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

console.log('Finished setup.')
