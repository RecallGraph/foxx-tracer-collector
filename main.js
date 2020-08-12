'use strict'

const createRouter = require('@arangodb/foxx/router')
const { basename, join } = require('path')
const { list, isDirectory } = require('fs')
const providers = require('./lib/handlers/providers')

const router = createRouter()
const routeBase = join(module.context.basePath, 'lib', 'routes')
const routes = list(routeBase).filter(route => isDirectory(`${routeBase}/${route}`))

routes.forEach(route => {
  const mountPath = basename(route, '.js')
  const childRouter = require(`./lib/routes/${route}`)
  router.use(`/${mountPath}`, childRouter)
})

module.context.use(router)

module.exports = providers
