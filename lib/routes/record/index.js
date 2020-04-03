'use strict'

const createRouter = require('@arangodb/foxx/router')

const router = createRouter()
require('./span')(router)

module.exports = router
