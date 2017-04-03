// server.js

// call the packages we need
var express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
var debug = require('debug')
var timeout = require('connect-timeout')

var log = debug('snib-middleware:log')
var error = debug('snib-middleware:error')
var app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}))
//app.use(bodyParser.urlencoded({extended: true}))

app.use(timeout('600s')) //10min

var port = process.env.PORT || 8080        // set our port

// console.log("port: " + port)

// Routes for our api
var verbsRouter = require('./routes/router')
var nicheRouter = require('./routes/nicherouter')

// Register our routes
// all of our routes will be prefixed with /snib
app.use('/snib', verbsRouter)
app.use('/niche', nicheRouter)

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
