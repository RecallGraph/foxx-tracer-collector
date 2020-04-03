'use strict'

const dotenv = require('dotenv')

dotenv.config()

module.exports = function (grunt) {
  grunt.initConfig({
    manifest: grunt.file.readJSON('manifest.json'),
    buildDir: './build',
    eslint: {
      src: [
        'main.js',
        'lib',
        'scripts',
        'Gruntfile.js',
        'tasks'
      ],
      options: {
        configFile: '.eslintrc.json',
        format: 'json',
        outputFile: './test/reports/eslint-report.json'
      }
    },
    copy: {
      lib: {
        files: [
          {
            expand: true,
            src: 'lib/**/*.js',
            dest: '<%= buildDir %>'
          }
        ]
      },
      main: {
        files: [
          {
            expand: true,
            src: [
              'scripts/**',
              'LICENSE',
              'main.js',
              'manifest.json',
              'package.json',
              'README.md'
            ],
            dest: '<%= buildDir %>'
          }
        ]
      }
    },
    clean: {
      build: ['build'],
      dist: ['dist']
    },
    uninstall: {
      command: ['build', 'foxx', 'uninstall'],
      options: {
        '--server': process.env.ARANGO_SERVER
      },
      args: [process.env.EVSTORE_MOUNT_POINT]
    },
    install: {
      command: ['build', 'foxx', 'install'],
      options: {
        '--server': process.env.ARANGO_SERVER
      },
      args: [process.env.EVSTORE_MOUNT_POINT]
    },
    replace: {
      command: ['build', 'foxx', 'replace'],
      options: {
        '--server': process.env.ARANGO_SERVER
      },
      args: [process.env.EVSTORE_MOUNT_POINT]
    },
    bundle: {
      command: ['build', 'foxx', 'bundle'],
      options: {
        '--outfile': '../dist/RecallGraph-<%= manifest.version %>.zip'
      },
      flags: ['-f']
    },
    installSvcDeps: {
      command: ['build', 'npm', 'install'],
      options: {
        '--only': 'prod'
      },
      flags: ['--no-package-lock', '--no-audit', '--prefer-offline']
    },
    exec: {
      root: {
        cmd: function (command, ...params) {
          return `${command} ${params.join(' ')}`
        }
      },
      build: {
        cwd: '<%= buildDir %>',
        cmd: function (command, ...params) {
          return `${command} ${params.join(' ')}`
        }
      }
    }
  })

  grunt.loadNpmTasks('gruntify-eslint')
  grunt.loadNpmTasks('grunt-exec')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadTasks('tasks')

  grunt.registerTask('build', ['copy:lib', 'copy:main', 'installSvcDeps'])
  grunt.registerTask('initialize', ['build', 'uninstall', 'install'])
  grunt.registerTask('dist', ['build', 'mkdir:dist', 'bundle'])
}
