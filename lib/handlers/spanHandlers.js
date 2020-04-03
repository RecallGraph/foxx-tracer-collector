'use strict'

const recordSpans = require('../operations/span')

function record (req) {
  return recordSpans(req.body)
}

module.exports = {
  record
}
