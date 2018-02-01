/*
* @Author: Raul Sierra
* @Date:   2018-01-31 17:48:51
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-01 10:19:08
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

 	var fossil = verb_utils.getParam(req, 'fossil', true)
	var sfecha = verb_utils.getParam(req, 'sfecha', true)

	var start_year = verb_utils.getParam(req, 'start_year', 0)
	var end_year = verb_utils.getParam(req, 'end_year', 9999)

	var N = 0

	if(covar_tax_level && sp_id) {
		debug('sp_id: ' + sp_id)
		debug('covar_tax_level: ' + covar_tax_level)
		debug('covar_tax_name: ' + covar_tax_name)
		debug('cells_col: ' + cells_col)

		try {
			pool.any("select count(*) from (SELECT DISTINCT $1:raw FROM snib where $2:raw = $3) as s",
				[cells_col, covar_tax_level, covar_tax_name])
				.then(data => {
					debug(data)
					res.json({'data': data, 'cells_col': cells_col, 'N': -1})
				})
				.catch(error => {
					debug(error)
				})			
		}
		catch(error) {
			debug(error)
		}

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