'use strict'

const { REFERENCE_CHILD_OF } = require('opentracing')
const { FoxxSpan: { generateUUID } } = require('@recallgraph/foxx-tracer')
const { time } = require('@arangodb')

exports.getSpanObj = function (spanData) {
  const ctime = time()

  if (spanData) {
    const parent = spanData.references.find(ref => ref.type === REFERENCE_CHILD_OF)
    if (!parent && !spanData.context.trace_id) {
      spanData.context.trace_id = generateUUID()
    }

    return {
      _key: spanData.context.span_id,
      ctime,
      data: spanData
    }
  }

  return null
}
