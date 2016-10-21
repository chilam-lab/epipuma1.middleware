
// server.js

// call the packages we need
var express    = require('express');
var app        = express();        
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var config = require('./config')
var port = process.env.PORT || 8080;        // set our port

var appContollers = require('./controllers/verbs');

// Routes for our api
var verbsRouter = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
verbsRouter.get('/', function(req, res) {
    res.json({data: {message: '¡Yey! Bienvenido al API de SNIB' }});   
});

verbsRouter.route('/getGridIds')
  .get(appContollers.getGridIds);

verbsRouter.route('/getSpecie')
  .get(appContollers.getSpeciesByName, appContollers.getSpecies)
  .post(appContollers.getSpeciesByName, appContollers.getSpecies);

verbsRouter.route('/getSpecie/:specieId')
  .get(appContollers.infoSpecie)
  .post(appContollers.infoSpecie);

// Register our routes
// all of our routes will be prefixed with /snib
app.use('/snib', verbsRouter);

// Start the server
var server = app.listen(port, function() {
  var port = server.address().port;
  console.log('Aplicación corriendo en el puerto %s', port);
});

// error handling
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(500)
      .json({
        status: 'error',
        message: err
      });
  });
}

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500)
    .send({
      status: 'error',
      message: err.message 
    });
});

module.exports = server;
