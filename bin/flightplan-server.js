const express = require('express')
const moment = require('moment')

const fp = require('../src')
const db = require('../shared/db')

const app = express()
const port = process.env.PORT || 5000

app.get('/api/config', async (req, res, next) => {
  try {
    // Insert each airline
    const airlines = fp.supported().map((id) => {
      const config = fp.new(id).config
      const { name, fares } = config
      return { id, name, fares }
    })

    // Specify the available cabin options
    const cabins = [
      { value: fp.cabins.first, label: 'First' },
      { value: fp.cabins.business, label: 'Business' },
      { value: fp.cabins.premium, label: 'Prem. Economy' },
      { value: fp.cabins.economy, label: 'Economy' }
    ]

    res.send({airlines, cabins})
  } catch (err) {
    next(err)
  }
})

app.get('/api/search', async (req, res, next) => {
  try {
    const {
      fromCity = '',
      toCity = '',
      quantity = '1',
      direction = 'oneway',
      startDate = '',
      endDate = '',
      cabin,
      limit
    } = req.query

    // Validate dates
    const start = moment(startDate)
    const end = moment(endDate)
    if (!start.isValid()) {
      throw new Error('Invalid start date:', startDate)
    }
    if (!end.isValid()) {
      throw new Error('Invalid end date:', endDate)
    }
    if (end.isBefore(start)) {
      throw new Error(`Invalid date range for search: ${start.format('L')} -> ${end.format('L')}`)
    }

    let query = 'SELECT * FROM awards WHERE '
    const params = []

    // Add cities
    if (direction === 'oneway') {
      query += 'fromCity = ? AND toCity = ?'
      params.push(fromCity, toCity)
    } else if (direction === 'roundtrip') {
      query += '((fromCity = ? AND toCity = ?) OR (toCity = ? AND fromCity = ?))'
      params.push(fromCity, toCity, fromCity, toCity)
    } else {
      throw new Error('Unrecognized direction parameter:', direction)
    }

    // Add dates
    query += ' AND date BETWEEN ? AND ?'
    params.push(start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD'))

    // Add quantity
    query += ' AND quantity >= ?'
    params.push(parseInt(quantity))

    // Add cabins
    if (cabin) {
      const values = cabin.split(',')
      query += ` AND cabin IN (${values.map(x => '?').join(',')})`
      values.forEach(x => params.push(x))
    }

    // Add limit
    if (limit) {
      query += ' LIMIT ?'
      params.push(parseInt(limit))
    }

    // Run SQL query
    let awards = await db.db().all(query, ...params)

    res.send(awards)
  } catch (err) {
    next(err)
  }
})

// Launch the Node.js app
function run () {
  console.log(`Running web server on port: ${port}`)
  return app.listen(port)
}

// First, try to open the database
console.log('Opening database...')
db.open()
  // Update db schema to the latest version using SQL-based migrations
  // .then(() => db.migrate({ force: 'last' }))
  .then(() => run())
  .then(() => console.log('Success!'))
  .catch((err) => console.error(err.stack))
