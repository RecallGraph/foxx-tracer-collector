'use strict'

const recordSpans = require('../operations/span')
const { validate, checkValidation } = require('../routes/helpers')
const { utils: { spanReqSchema } } = require('@recallgraph/foxx-tracer')

const providerSchemas = [spanReqSchema]

function record (req) {
  return recordSpans(req.body)
}

function recordProvider (spanData) {
  const result = validate([spanData], providerSchemas)
  checkValidation(result)

  return recordSpans(result.values[0])
}

module.exports = {
  record,
  recordProvider
}
