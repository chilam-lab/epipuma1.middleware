var pg = require('pg');
var config = require('../config.js');

var pool = new pg.Pool(config.db);

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
