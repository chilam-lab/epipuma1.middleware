// server.js

// call the packages we need
var express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
var debug = require('debug')
// var timeout = require('connect-timeout')
var config = require('./config')
var zlib = require('zlib')

var compression = require('compression')
var log = debug('snib-middleware:log')
var error = debug('snib-middleware:error')
var bodyParser = require('body-parser');

var app = express()

//app.set('view engine', 'ejs');
//app.use(express.static('public'));
app.use(compression({filter:shouldCompress, level:zlib.Z_BEST_COMPRESSION}))
app.use(cors())
app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
//app.use(bodyParser.urlencoded({extended: true}))

function shouldCompress (req, res) {
  return compression.filter(req, res)
}

// app.use(timeout('240000')) //4min
// app.use(haltOnTimedout);

// function haltOnTimedout(req, res, next){
//   if (!req.timedout) next();
// }



var port = config.port   // set our port

// console.log("port: " + port)

// Routes for our api
var nicheRouter = require('./routes/nicherouter')
var netRouter = require('./routes/networkrouter')
var utilsRouter = require('./routes/utilsrouter')
var cellsRouter = require('./routes/cellsrouter')
var taxaRouter = require('./routes/taxarouter')

// Register our routes
// all of our routes will be prefixed with /snib
app.use('/niche',
        nicheRouter,
        netRouter,
        utilsRouter,
        cellsRouter)

app.use('/taxa',
        taxaRouter)

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

server.setTimeout(20 * 60 * 1000)

module.exports = server
