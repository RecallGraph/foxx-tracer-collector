'use strict'

const { find } = require('lodash')
const Joi = require('joi')

function validate (values, schemas) {
  const results = {
    valid: true,
    values: [],
    errors: []
  }

  values.forEach((value, i) => {
    const schema = schemas[i]
    const res = Joi.validate(value, schema)

    results.values.push(res.value)
    results.errors.push(res.error)

    if (res.error) {
      results.valid = false
    }
  })

  return results
}

function checkValidation (result) {
  if (!result.valid) {
    throw find(result.errors)
  }
}

module.exports = {
  validate,
  checkValidation
}
