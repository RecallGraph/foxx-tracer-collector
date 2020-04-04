'use strict'

const { deleteReportCron } = require('../lib/helpers')

// Teardown crons
deleteReportCron()

console.log('Finished teardown.')
