'use strict'

const { record } = require('../../handlers/spanHandlers')
const { utils: { spanReqSchema } } = require('@recallgraph/foxx-tracer')

module.exports = router => {
  router
    .post(
      '/span',
      function (req, res) {
        try {
          const result = record(req)
          res.status(202)
          res.json(result)
        } catch (e) {
          res.throw(500, { cause: e })
        }
      },
      'span'
    )
    .body(spanReqSchema, 'The opentrace-compatible span(s) to record.')
    .response(
      202,
      ['application/json'],
      'The record call was accepted'
    )
    .error(
      400,
      'Invalid request body/params. Response body contains the error details.'
    )
    .summary('Record a single or multiple opentrace-compatible span(s).')
    .description('Record a single or multiple opentrace-compatible span(s).')
    .tag('Record')

  console.debug('Loaded "span" routes')
}
