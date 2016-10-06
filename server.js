
// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var app        = express();        

var config = require('./config')
var port = process.env.PORT || 8080;        // set our port

var methodsVerbs = require('./methods/verbs');

// Routes for our api
var verbsRouter = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
verbsRouter.get('/', function(req, res) {
    res.json({data: {message: '¡Yey! Bienvenido al API de SNIB' }});   
});

verbsRouter.route('/getGridIds')
  .get(methodsVerbs.getGridIds)

// Register our routes
// all of our routes will be prefixed with /snib
app.use('/snib', verbsRouter);

// Start the server
var server = app.listen(port, function() {
  var port = server.address().port;
  console.log('Aplicación corriendo en el puerto %s', port);
});

module.exports = server;
