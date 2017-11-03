/*
* @Author: Raul Sierra
* @Date:   2017-10-25 18:02:27
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-10-30 11:35:11
*/
/**
* Este verbo regresa la frecuencia del score por celda para poder desplegar el
* mapa de probabilidad
*
* @module controllers/getCellScoreNiche
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getSpeciesCells')
var verb_utils = require('./verb_utils')

var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 

function getTaxonCells(req, res, next) {
	var tax_level = verb_utils.getParam(req, 'tax_level')
	var tax_name = verb_utils.getParam(req, 'tax_name')

	var cell_res = verb_utils.getParam(req, 'cells_res', 16)
 	var cells_col = "gridid_" + cell_res + "km"

 	var fossil = verb_utils.getParam(req, 'fossil', true)
	var sfecha = verb_utils.getParam(req, 'sfecha', true)

	var start_year = verb_utils.getParam(req, 'start_year', 0)
	var end_year = verb_utils.getParam(req, 'end_year', 9999)

	if(tax_level) {
		pool.any(queries.getCells.forTaxon, {
				"tax_level": tax_level,
				"tax_name": tax_name,
				"res_celda": cells_col,
				"fossil": fossil,
				"sfecha": sfecha,
				"start_year": start_year,
				"end_year": end_year
    		})
			.then(function (data) {
				res.json({'data': data, 'cells_col': cells_col})
			})
			.catch(function (error) {
				debug(error)
				next(error)
			})
	}
	else {
		next()
	}
}

function getSpeciesCells(req, res, next) {
	var sp_id = verb_utils.getParam(req, 'sp_id')
	var cell_res = verb_utils.getParam(req, 'cells_res', 16)
 	var cells_col = "cells_" + cell_res + "km"

	if(sp_id) {
		pool.any(queries.getCells.forSpecies, {
				"spid": sp_id,
				"res_celda": cells_col
    		})
			.then(function (data) {
				res.json({'data': data[0], 'cells_col': cells_col})
			})
			.catch(function (error) {
				debug(error)
				next(error)
			})
	}
	else {
		next()
	}
}

function getHelloMessage(req, res, next) {
	res.json({'msg': 'cells endpoint listening'})
}

/**
 * Esta variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getScoreDecilNiche. Actualmente el flujo es 
 * getScoreDecilNiche_A, getScoreDecilNiche_V, getScoreDecilNiche_T y 
 * getScoreDecilNiche.
 *
 * @see controllers/getScoreDecilNiche~getScoreDecilNiche_A
 * @see controllers/getScoreDecilNiche~getScoreDecilNiche_V
 * @see controllers/getScoreDecilNiche~getScoreDecilNiche_T
 * @see controllers/getScoreDecilNiche~getScoreDecilNiche
 */
exports.pipe = [
	getTaxonCells,
	getSpeciesCells,
  	getHelloMessage 
]