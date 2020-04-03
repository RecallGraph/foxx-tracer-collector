'use strict'

const { db } = require('@arangodb')
const { SERVICE_COLLECTIONS } = require('../../helpers')

const spanColl = db._collection(SERVICE_COLLECTIONS.spans)

module.exports = function record (spanRecord) {
  if (Array.isArray(spanRecord)) {
    spanRecord.forEach(span => span._key = span.context.span_id)
  } else {
    spanRecord._key = spanRecord.context.span_id
  }

  return spanColl.save(spanRecord, { waitForSync: false })
}
