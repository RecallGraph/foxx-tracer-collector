'use strict'

const { record } = require('../../handlers/spanHandlers')
const { isEmpty } = require('lodash')
const { getCRUDErrors } = require('../helpers')
const { utils: { spanReqSchema } } = require('foxx-tracing')

module.exports = router => {
  router
    .post(
      '/span',
      function (req, res) {
        let result

        if (Array.isArray(req.body)) {
          result = record(req)
          const errors = getCRUDErrors(result)
          if (isEmpty(errors)) {
            res.status(201)
          } else {
            res.setHeader('X-Arango-Error-Codes', errors)
            res.status(412)
          }
        } else {
          try {
            result = record(req)
            res.status(201)
          } catch (e) {
            if (e.errorNum) {
              res.setHeader('X-Arango-Error-Codes', `${e.errorNum}:1`)
              result = e.errorMessage

              res.status(412)
            } else {
              return res.throw(500, { cause: e })
            }
          }
        }

        res.json(result)
      },
      'span'
    )
    .body(spanReqSchema, 'The opentrace-compatible span(s) to record.')
    .response(
      201,
      ['application/json'],
      'The record call succeeded. For multiple spans, this is returned only if' +
      ' **ALL** spans were successfully recorded.'
    )
    .error(
      400,
      'Invalid request body/params. Response body contains the error details.'
    )
    .error(
      412,
      'One or more spans could not be created (due to a conflict or some other failed pre-condition).' +
      ' A header X-Arango-Error-Codes is set, which contains a map of the error codes that occurred together with' +
      ' their multiplicities, as in: 1200:17,1205:10 which means that in 17 cases the error 1200 “revision conflict”' +
      ' and in 10 cases the error 1205 “illegal document handle” has happened. The error details are in the response' +
      ' body.'
    )
    .summary('Record a single or multiple opentrace-compatible span(s).')
    .description('Record a single or multiple opentrace-compatible span(s).')
    .tag('Record')

  console.debug('Loaded "span" route')
}
