'use strict'

const { memoize } = require('lodash')
const { Tracer: NoopTracer } = require('opentracing')
const { FoxxTracer, reporters: { ConsoleReporter, DatadogReporter } } = require('foxx-tracing')

// noinspection JSUnusedGlobalSymbols
const tracers = Object.freeze({
  console: () => new ConsoleReporter(),
  datadog: () => {
    const ddURL = module.context.service.configuration['dd-agent-url']
    const manifest = module.context.manifest
    const service = `${manifest.name}-${manifest.version}`

    return new FoxxTracer(new DatadogReporter(ddURL, service))
  },
  noop: () => new NoopTracer()
})

exports.getTracer = memoize(key => tracers[key]() || tracers.noop())

const SERVICE_COLLECTIONS = Object.freeze({
  spans: module.context.collectionName('_spans')
})
exports.SERVICE_COLLECTIONS = SERVICE_COLLECTIONS
