'use strict'

const queues = require('@arangodb/foxx/queues')
const { reporters: { ConsoleReporter, DatadogReporter } } = require('foxx-tracing')

// noinspection JSUnusedGlobalSymbols
const reporters = Object.freeze({
  console: () => new ConsoleReporter(),
  datadog: () => {
    const ddURL = module.context.service.configuration['dd-agent-url']
    const manifest = module.context.manifest
    const service = `${manifest.name}-${manifest.version}`

    return new DatadogReporter(ddURL, service)
  }
})

exports.getReporter = function (key) {
  return reporters[key] ? reporters[key]() : null
}

const SERVICE_COLLECTIONS = Object.freeze({
  spans: module.context.collectionName('_spans')
})
exports.SERVICE_COLLECTIONS = SERVICE_COLLECTIONS

exports.createReportCron = function createReportCron () {
  const queue = queues.create('crons', 1)
  // noinspection JSUnresolvedVariable
  const mount = module.context.mount
  const cronJob = 'reportTraces'

  const stored = queue.all({
    name: cronJob,
    mount
  })

  stored.forEach(jobId => {
    const job = queue.get(jobId)

    console.log('Deleting stored job: %o', job)
    queue.delete(jobId)
  })

  // noinspection JSUnusedGlobalSymbols
  queue.push({
    mount,
    name: cronJob
  }, null, {
    maxFailures: Infinity,
    repeatTimes: Infinity,
    failure: (result, jobData, job) => console.error(`Failed job: ${JSON.stringify({
      result,
      job: [
        job.queue,
        job.type,
        job.failures,
        job.runs,
        job.runFailures
      ]
    })}`),
    success: (result, jobData,
      job) => {
      if (Object.keys(result).some(key => result[key].length)) {
        console.debug(`Passed job: ${JSON.stringify({
          result,
          job: [job.queue, job.type, job.runs, job.runFailures]
        })}`)
      }
    },
    repeatDelay: 10000
  })
}

exports.deleteReportCron = function deleteReportCron () {
  try {
    const queue = queues.get('crons')
    // noinspection JSUnresolvedVariable
    const mount = module.context.mount
    const cronJob = 'reportTraces'

    const stored = queue.all({
      name: cronJob,
      mount
    })

    stored.forEach(jobId => {
      const job = queue.get(jobId)

      console.log('Deleting stored job: %o', job)

      queue.delete(jobId)
    })

    queues.delete('crons')
  } catch (e) {
    console.error(e)
  }
}
