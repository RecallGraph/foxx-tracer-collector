'use strict'

const joi = require('joi')
const { record } = require('../../handlers/spanHandlers')
const { isEmpty } = require('lodash')
const { getCRUDErrors } = require('../helpers')
const { REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM } = require('opentracing')

const spanIdSchema = joi.string().length(16)
const traceIdSchema = joi.alternatives().try(spanIdSchema, joi.string().length(32))
const contextSchema = joi.object()
  .keys({
    trace_id: traceIdSchema.required(),
    span_id: spanIdSchema.required(),
    baggage: joi.object().required()
  })
  .unknown(true)
  .optionalKeys('baggage', 'trace_id')
const tagsSchema = joi.object()
  .pattern(/.+/, joi.alternatives().try(joi.string(), joi.boolean(), joi.number()).required())
const logSchema = joi.object()
  .keys({
    fields: joi.object().pattern(/.+/, joi.any()).required(),
    timestamp: joi.number().required()
  })
  .optionalKeys('timestamp')
const referenceSchema = joi.object().keys({
  type: joi.string().valid(REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM).required(),
  context: contextSchema.required()
})
const objSchema = joi
  .object()
  .keys({
    operation: joi.string().required(),
    context: contextSchema.required(),
    startTimeMs: joi.number().required(),
    finishTimeMs: joi.number().required().min(joi.ref('startTimeMs')),
    tags: tagsSchema.required(),
    logs: joi.array().items(logSchema.required()).required(),
    references: joi.array().items(referenceSchema.required()).required()
  })
  .optionalKeys('tags', 'logs', 'references')
const arrSchema = joi
  .array()
  .items(objSchema.required())
  .min(1)
const reqBodySchema = joi
  .alternatives()
  .try(objSchema, arrSchema)
  .required()

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
    .body(reqBodySchema, 'The opentrace-compatible span(s) to record.')
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
