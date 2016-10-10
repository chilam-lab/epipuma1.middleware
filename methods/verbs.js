var pg = require('pg');
var config = require('../config.js');

var pool = new pg.Pool(config.db);


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

exports.getGridIds = function(req, res) {
  pool.query('SELECT gridid FROM public.sp_grid_terrestre', 
             function(err, result) {
               if(err) res.sendStatus(500).status(err.message);
               res.json({'data': result.rows});
             });
};


/**
 * getSpecie regresa la clasificación de las especies relacionadas
 * a la cadena `nom_sp`. 
 *
 * Responde la calasificación de las especies que están relacionadas con 
 * una cadena enviada, `nom_sp`, o algunas si no se envia cadena o la 
 * cadena es vacia. Además se acepta el parámetro `limit`.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getSpecie = function(req, res) {
  var specie_name = getParam(req, 'nom_sp');
  var limit = getParam(req, 'limit', 20);
  if (specie_name) {
    var queryConfig = {
        text: "SELECT nom_sp, spid, reinovalido, phylumdivisionvalido, " +
              "clasevalida, ordenvalido, familiavalida, generovalido, " + 
              "epitetovalido FROM sp_snib " +
              "WHERE " +
              "to_tsvector(especievalidabusqueda) @@ to_tsquery($1) " +
              "LIMIT $2 OFFSET 0;",
        values: [specie_name + ':*', limit]
      };
  } else {
    var queryConfig = {
        text: "SELECT nom_sp, spid, reinovalido, phylumdivisionvalido, " +
              "clasevalida, ordenvalido, familiavalida, generovalido, " + 
              "epitetovalido FROM sp_snib " +
              "LIMIT $1 OFFSET 0;",
        values: [limit]
      };
  }
  pool.query(queryConfig, function(err, result) {
    if (err) {
      res.status(500);
      res.json({'err': err.message});
    } else res.json({'data': result.rows});
    });
};
