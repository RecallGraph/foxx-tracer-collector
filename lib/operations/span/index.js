'use strict'

const { getSpanObj } = require('./helpers')
const tasks = require('@arangodb/tasks')
const { SERVICE_COLLECTIONS } = require('../../helpers')

module.exports = function record (spanData) {
  let spanObj
  if (Array.isArray(spanData)) {
    spanObj = spanData.map(getSpanObj)
  } else {
    spanObj = getSpanObj(spanData)
  }

  const task = tasks.register({
    command: function (params) {
      const { db } = require('@arangodb')

      db[params.spanColl].save(params.spanObj, { waitForSync: false })
    },
    params: { spanObj, spanColl: SERVICE_COLLECTIONS.spans }
  })

  return task.id
}
