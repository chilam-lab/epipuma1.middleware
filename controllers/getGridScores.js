/*
* @Author: Raul Sierra
* @Date:   2018-01-31 17:48:51
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-06 12:45:32
*/

/**
* Este verbo regresa los scores del grid 
*
* @module controllers/getGridScores
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/

var debug = require('debug')('verbs:getGridScores')
var verb_utils = require('./verb_utils')
var moment = require('moment')

var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 

/**
* Get all the grid cells that contain at least one observation of a given taxon
* 
* 
*/
function getGridScores(req, res, next) {
 	var sp_id = verb_utils.getParam(req, 'sp_id')

	var covar_tax_level = verb_utils.getParam(req, 'covar_tax_level')
	var covar_tax_name = verb_utils.getParam(req, 'covar_tax_name')

	var cell_res = verb_utils.getParam(req, 'cells_res', 16)
 	var cells_col = "gridid_" + cell_res + "km"
	var res_celda_sp = 'cells_' + cell_res + 'km'
	var res_celda_snib = 'gridid_' + cell_res + 'km'
	var res_celda_snib_tb = 'grid_' + cell_res + 'km_aoi'
	var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

	// filtros por tiempo
	var sfecha            = verb_utils.getParam(req, 'sfecha', false)
	var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
	var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')

	var filter_time = false;


	var N = 0

	if(covar_tax_level && sp_id) {
		debug('sp_id: ' + sp_id)
		debug('covar_tax_level: ' + covar_tax_level)
		debug('covar_tax_name: ' + covar_tax_name)
		debug('cells_col: ' + cells_col)
		var tfilters    = verb_utils.getParam(req, 'tfilters')
		var fossil = verb_utils.getParam(req, 'fossil', '')
		var sfecha = verb_utils.getParam(req, 'sfecha', true)

		var start_year = verb_utils.getParam(req, 'start_year', 0)
		var end_year = verb_utils.getParam(req, 'end_year', 9999)

		debug(tfilters)
		var whereVar = verb_utils.processBioFilters(tfilters, sp_id)
		debug(whereVar)
		var n = -1

		var caso = -1
		// debug('caso: ' + caso)

		filter_time = caso !== -1 ? true : filter_time
		debug('filter_time: ' + filter_time)

		pool.task(t => {
			return t.one("select count(*) as n from (SELECT DISTINCT $1:raw FROM snib where $2:raw = $3) as s",
					[cells_col, covar_tax_level, covar_tax_name])
					.then(count => {
						n = count.n
						return t.any(queries.getFreqMapNiche.getFreqMapBio, {
									  iterations: 1,
									  spid: sp_id,
									  N: n,
									  alpha: 0.0001,
									  min_occ: 10,
									  fossil: '',
									  sfecha: sfecha,
									  where_config: whereVar,
									  res_celda_sp: res_celda_sp,
									  res_celda_snib: res_celda_snib,
									  res_celda_snib_tb: res_celda_snib_tb, 
									  discardedDeleted: discardedDeleted,
									  lim_inf: fecha_incio.format('YYYY'),
									  lim_sup: fecha_fin.format('YYYY'),
									  caso: caso,
									  filter_time: filter_time,
									  idtabla: '',
  									  n_grid_coverage: 'full'
									})
					});
		})
		.then(data => {
			res.json({'data': data, 'cells_col': cells_col, 'N': parseInt(n)})
		})
  		.catch(err => {
			debug(err)
			next(err)
		})			

	} else {
		next()
	}
}

function getHelloMessage(req, res, next) {
	res.json({'msg': 'grid_scores endpoint listening'})
}

/**
 * Esta variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getScoreDecilNiche. Actualmente el flujo es 
 * getScoreDecilNiche_A, getScoreDecilNiche_V, getScoreDecilNiche_T y 
 * getScoreDecilNiche.
 *
 * @see controllers/getChildrenTaxa
 */
exports.pipe = [
	getGridScores,
	getHelloMessage
]