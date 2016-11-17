// server.js

// call the packages we need
var express = require('express')
var debug = require('debug')
var log = debug('snib-middleware:log')
var error = debug('snib-middleware:error')
var cors = require('cors')
var app = express()
var bodyParser = require('body-parser')

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

var port = process.env.PORT || 8080        // set our port

// Routes for our api
var verbsRouter = require('./routes/router')

// Register our routes
// all of our routes will be prefixed with /snib
app.use('/snib', verbsRouter)

// Start the server
var server = app.listen(port, function () {
  var port = server.address().port
  log('Aplicación corriendo en el puerto %s', port)
})

// error handling
if (app.get('env') === 'development') {
  // eslint-disable-next-line
  app.use(function (err, req, res, next) {
    res.status(500)
      .json({
        status: 'error',
        message: err
      })
  })
}

// eslint-disable-next-line
app.use(function (err, req, res, next) {
  error(err.stack)
  res.status(500)
    .send({
      status: 'error',
      message: err.message
    })
})

module.exports = server
