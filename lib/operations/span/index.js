'use strict'

const { getSpanObj } = require('./helpers')
const tasks = require('@arangodb/tasks')
const { SERVICE_COLLECTIONS } = require('../../helpers')
const { isEmpty } = require('lodash')

module.exports = function record (spanData) {
  let spanObj
  if (Array.isArray(spanData)) {
    spanObj = spanData.map(getSpanObj).filter(s => s !== null)
  } else {
    spanObj = getSpanObj(spanData)
  }

  if (!isEmpty(spanObj)) {
    const task = tasks.register({
      command: function (params) {
        const { db } = require('@arangodb')

        db[params.spanColl].save(params.spanObj, { waitForSync: false })
      },
      params: { spanObj, spanColl: SERVICE_COLLECTIONS.spans }
    })

    return task.id
  }

  return null
}
