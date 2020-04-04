'use strict'

const { db } = require('@arangodb')
const { SERVICE_COLLECTIONS } = require('../../helpers')
const { getSpanObj } = require('./helpers')

const spanColl = db._collection(SERVICE_COLLECTIONS.spans)

module.exports = function record (spanData) {
  let spanObj
  if (Array.isArray(spanData)) {
    spanObj = spanData.map(getSpanObj)
  } else {
    spanObj = getSpanObj(spanData)
  }

  return spanColl.save(spanObj, { waitForSync: false })
}
