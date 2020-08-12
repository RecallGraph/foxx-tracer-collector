'use strict'

const manifest = require('../manifest.json')
const parse = require('parse-package-name')

const CONFIG_KEY_REGEX = /^[_$a-z][-_$a-z0-9]*$/

function loadJSON (grunt, file) {
  const { exists, readJSON } = grunt.file

  return exists(file) ? readJSON(file) : {}
}

module.exports = function (grunt) {
  grunt.registerTask('reporter', 'Manage foxx-tracer-reporter plugins.',
    function (command) {
      let pkg = grunt.option('pkg')
      const namespace = grunt.option('namespace')
      const reporters = loadJSON(grunt, 'reporters.json')
      let task, err

      switch (command) {
        case 'add':
          if (!namespace || !pkg) {
            grunt.log.writeln('Usage: [npx] grunt reporter:add --pkg=<pkg> --namespace=<namespace>')
            err = new Error('Both "pkg" and "namespace" must be non-empty.')
          } else if (Object.keys(reporters).includes(namespace)) {
            err = new Error(`Namespace '${namespace}' is already in use in 'reporters.json'.`)
          } else if (manifest.configuration[`reporters-${namespace}`]) {
            err = new Error(`Namespace '${namespace}' is already in use in manifest configuration.`)
          } else if (!CONFIG_KEY_REGEX.test(namespace)) {
            err = new Error(`Namespace '${namespace}' is not a valid configuration key. See 
            https://www.arangodb.com/docs/stable/foxx-reference-configuration.html for more information.`)
          } else {
            pkg = parse(pkg).name
            grunt.log.writeln(`Installing reporter plugin '${pkg}' under '${namespace}'...`)
            task = ['exec', 'root', 'npm', 'install', pkg, '-s'].join(':')
            grunt.task.run(task)

            task = ['reporter', 'merge', '--namespace', namespace].join(':')
            grunt.task.run(task)

            reporters[namespace] = pkg
            grunt.file.write('reporters.json', JSON.stringify(reporters, null, 2))
          }

          break

        case 'remove':
          if (!namespace) {
            grunt.log.writeln('Usage: [npx] grunt reporter:remove --namespace=<namespace>')
            err = new Error('"namespace" must be non-empty.')
          } else if (!reporters[namespace]) {
            err = new Error(`Namespace '${namespace}' not found in 'reporters.json'.`)
          } else {
            pkg = reporters[namespace]
            grunt.log.writeln(`Uninstalling reporter plugin '${pkg}'...`)
            task = ['exec', 'root', 'npm', 'uninstall', pkg, '-s'].join(':')
            grunt.task.run(task)

            delete manifest.configuration[`reporters-${namespace}`]
            grunt.file.write('manifest.json', JSON.stringify(manifest, null, 2))

            delete reporters[namespace]
            grunt.file.write('reporters.json', JSON.stringify(reporters, null, 2))
          }

          break

        case 'merge':
          if (!namespace) {
            grunt.log.writeln('Usage: [npx] grunt reporter:merge --namespace=<namespace>')
            err = new Error('"namespace" must be non-empty.')
          } else if (!reporters[namespace]) {
            err = new Error(`Namespace '${namespace}' not found in 'reporters.json'.`)
          } else {
            pkg = reporters[namespace]
            grunt.log.writeln(`Merging reporter config from '${pkg}' into 'manifest.json' ...`)

            const mConfFile = `node_modules/${pkg}/manifest-config.json`
            const mConf = loadJSON(grunt, mConfFile)
            manifest.configuration[`reporters-${namespace}`] = Object.assign({
              type: 'json',
              required: true,
              default: {}
            }, mConf)

            grunt.file.write('manifest.json', JSON.stringify(manifest, null, 2))
          }

          break

        default:
          grunt.log.writeln('Usage: [npx] grunt reporter:<add|remove> --pkg=<pkg> [--namespace=<namespace>]')
          err = new Error('Command not recognized.')
      }

      if (err) {
        grunt.fatal(err)
      }
    })
}
