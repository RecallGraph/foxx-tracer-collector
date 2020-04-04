'use strict'

const { db, query, time } = require('@arangodb')
const { SERVICE_COLLECTIONS, getReporter } = require('../lib/helpers')
const { REFERENCE_CHILD_OF } = require('opentracing')

const spanColl = db._collection(SERVICE_COLLECTIONS.spans)
const enabledReporters = module.context.service.configuration.reporters.split(/, */)
const reporters = enabledReporters.map(getReporter).filter(r => r !== null)

const count = query`
  for s in ${spanColl}
  filter s.data.context.trace_id == null
  filter !s.reported
  
  let pkey = first(s.data.references[* filter CURRENT.type == ${REFERENCE_CHILD_OF} return CURRENT.context.span_id])
  let parent = document(${spanColl}, pkey)
  filter parent != null && parent.data.context.trace_id != null
  
  update s with {data: {context: {trace_id: parent.data.context.trace_id}}} in ${spanColl}
  collect with count into total
  
  return total
`.next()
if (count) {
  console.log(`Updated ${count} spans with trace_ids.`)
}

let traces = query`
  for s in ${spanColl}
  filter s.data.context.trace_id != null
  filter !s.reported
  collect trace_id = s.data.context.trace_id into spans = s.data
  
  return spans
`.toArray()
let spanKeys = getSpanKeys(traces)
const ttl = Math.max(module.context.service.configuration[['reported-span-ttl']], 60)

if (spanKeys.length) {
  reporters.forEach(reporter => reporter.report(traces))

  const dtime = time() + ttl
  markReported(spanKeys, dtime)
}

const now = time()
const minCtime = now - ttl
traces = query`
  for s in ${spanColl}
  filter s.ctime < ${minCtime}
  filter !s.reported
  
  return [s.data]
`.toArray()
if (traces.length) {
  reporters.forEach(reporter => reporter.report(traces))
  spanKeys = getSpanKeys(traces)
  markReported(spanKeys, now)
}

function markReported (spanKeys, dtime) {
  const count = query`
  for s in ${spanColl}
  filter s._key in ${spanKeys}
  
  update s with {reported: true, dtime: ${dtime}} in ${spanColl}
  collect with count into total
  
  return total
`.next()
  console.log(`Reported ${count} spans.`)
}

function getSpanKeys (traces) {
  return traces.flat().map(span => span.context.span_id)
}
