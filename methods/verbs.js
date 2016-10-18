var pg = require('pg');
var moment = require('moment');
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

exports.getGridIds = function(req, res, next) {
  pool.query('SELECT gridid FROM public.sp_grid_terrestre', 
             function(err, result) {
               if(err) {
                 next(err);
                } else {
                 res.json({'data': result.rows});
                }
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

exports.getSpecie = function(req, res, next) {
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
      next(err);
    } else res.json({'data': result.rows});
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

exports.infoSpecie = function(req, res, err) {
  var specie_id = req.params.specieId;
  var fecha_incio = moment(getParam(req, 'fechaincio','1500'),
                           ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
  var fecha_fin = moment(getParam(req, 'fechafin', Date.now()),
                         ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
  var sin_fecha = Number(getParam(req, 'sfecha', 1));
  
  var queryConfig = {
    text: "WITH grid_data AS(" +
          "  SELECT geom AS grid_geom, gridid FROM sp_grid_terrestre WHERE animalia || plantae ||" +
		      "    fungi || protoctista || prokaryotae  || animalia_exoticas || plantae_exoticas || " +
		      "    fungi_exoticas || protoctista_exoticas || prokaryotae_exoticas @> ARRAY[$1::integer]" +
          "  ), " +
          " grid_occ AS ("+
	        "   SELECT count(*) AS occ_cell FROM grid_data" +
          "  ) " +
          " SELECT DISTINCT st_asgeojson(the_geom) AS json_geom, gridid, entid, occ_cell, " +
          "  urlejemplar, fechacolecta FROM public.snib JOIN grid_data ON ST_Contains(grid_geom, the_geom), " +
          "  grid_occ WHERE spid = $1 ORDER BY gridid;",
    values: [specie_id]
  };

  pool.query(queryConfig, function(err, result) {
    if (err) {
      next(err);
    } else {
      var qresults = result.rows;
      qresults.map(function(e){
        e.json_geom = JSON.parse(e.json_geom);
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

      res.json({'data': qresults});}
  });
};
