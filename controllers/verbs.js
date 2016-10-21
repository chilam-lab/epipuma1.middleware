var pgp = require('pg-promise')();
var moment = require('moment');

var config = require('../config.js');
var queries = require('./sql/queryProvider.js');

var pool = pgp(config.db);

/**
 * Return the value of param `name` when present or `defaultValue`.
 *
 *  - Checks body params, ex: id=12, {"id":12}
 *  - Checks query string params, ex: ?id=12
 *
 * To utilize request bodies, `req.body`
 * should be an object. This can be done by using
 * the `bodyParser()` middleware.
 *
 * @param {express.Request} req
 * @param {String} name
 * @param {Mixed} [defaultValue]
 * @return {String}
 * 
 */

var getParam = function(req, name, defaultValue) {
  var body = req.body || {};
  var query = req.query || {};

  var args = arguments.length === 2
    ? 'req, name'
    : 'req, name, default';

  if (null != body[name]) return body[name];
  if (null != query[name]) return query[name];

  return defaultValue;
};


/**
 * GetGridIds de SNIB DB
 *
 * Responde los valores de los ids de las celdas donde se calculan
 * los indices.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGridIds = function(req, res, next) {
  pool.any(queries.grid.getIds)
    .then(function(data){
      res.json({'data': data});
    })
    .catch(function(error){
      console.log(error);
      next(error);
    })
};


/**
 * getSpeciesByName regresa la clasificación de las especies relacionadas
 * a la cadena `nom_sp`. 
 *
 * Responde la clasificación de las especies que están relacionadas con 
 * una cadena enviada, `nom_sp`. Además se acepta el parámetro `limit`.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getSpeciesByName = function(req, res, next) {
  var specie_name = getParam(req, 'nom_sp');
  var limit = getParam(req, 'limit', 20);
  if (specie_name){
    pool.any(queries.specie.getByName, {query_name: specie_name + ':*', 
      limit: limit})
      .then(function(data){
        res.json({'data': data});
      })
      .catch(function(error){
        next(error);
      })
  } else {
  next();
  }
};

/**
 * getSpecies regresa la clasificación de un número determinado de especies. 
 *
 * Responde la clasificación de un número determinado, `limit`, de especies.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getSpecies = function(req, res, next) {
  var limit = getParam(req, 'limit', 20);
  pool.any(queries.specie.getAll, {limit: limit})
    .then(function(data){
      res.json({'data': data});
    })
    .catch(function(error){
      next(error);
    });
};

/**
 * infoSpecie regresa GeoJson con las coordenadas de las ocurrencias de la
 * especie además de información adicional sobre la información de las 
 * observaciones.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.infoSpecie = function(req, res, next) {
  var specie_id = req.params.specieId;
  var fecha_incio = moment(getParam(req, 'fechaincio','1500'),
                           ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
  var fecha_fin = moment(getParam(req, 'fechafin', Date.now()),
                         ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
  var sin_fecha = Number(getParam(req, 'sfecha', 1));
  
  pool.any(queries.specie.getInfo, {spid: specie_id})
    .then(function(data){
      data.map(function(e){
        e.json_geom = JSON.parse(e.json_geom);
        // Filtrado de fecha 
        var fechacolecta = moment(e.fechacolecta, 
                                  ["YYYY-MM-DD", "YYYY-MM", "YYYY"], 'es')
        if (fechacolecta.isBetween(fecha_incio, fecha_fin)) {
          e.discarded = 0;
        } else if (sin_fecha && !(fechacolecta.isValid())) {
          e.discarded = 0;
        } else {
          e.discarded = 1;
        }
      });
      res.json({'data': data})
    })
    .catch(function(error){
      next(error);
    });
};

/**
 * getCountGridid regresa el conteo por celda de un conjunto de especies 
 * definidas por el cliente
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
// export getCountGridid = function(req, res, next){
//   var speciesIdArray = getParam(req, 'spid', [])
// 
// };
