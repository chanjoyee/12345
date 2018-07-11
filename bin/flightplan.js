#!/usr/bin/env node

// Setup sub-commands
require('commander')
  .version(require('../package.json').version)
  .command('search', 'Search for award inventory.')
  .command('parse', 'Parse search results from database.')
  .command('import', 'Import search results from another directory.')
  .command('cleanup', 'Remove incomplete requests or data resources.')
  .command('stats', 'Print statistics on routes stored in the database.')
  .command('client', 'Launch the web client.')
  .command('server', 'Launch the web server.')
  .parse(process.argv)
