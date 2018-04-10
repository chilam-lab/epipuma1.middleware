/*
* @Author: Raul Sierra
* @Date:   2018-02-07 12:25:26
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-09 18:17:13
*/
const debug = require('debug')('verbs:getBioScores')
const verb_utils = require('./verb_utils')
const queries = require('./sql/queryProvider')
const pool = verb_utils.pool
const moment = require('moment')

function getBioScores(req, res, next) {
	debug("getBioScores")
 	const sp_id = verb_utils.getParam(req, 'sp_id')

	const covar_tax_level = verb_utils.getParam(req, 'covar_tax_level')
	const covar_tax_name = verb_utils.getParam(req, 'covar_tax_name')
	const grid_res = verb_utils.getParam(req, 'grid_res', 16)
	const res_celda_sp = 'cells_' + grid_res + 'km'
	const res_celda_snib = 'gridid_' + grid_res + 'km'
	const res_celda_snib_tb = 'grid_' + grid_res + 'km_aoi'

	debug('sp_id: ' + sp_id)
	debug('covar_tax_level: ' + covar_tax_level)
	debug('covar_tax_name: ' + covar_tax_name)
	debug('grid_res: ' + grid_res)
	debug('res_celda_snib: ' + res_celda_snib)

	if(covar_tax_level && sp_id) {
		debug("Build query and send....")
		try {
			const discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
			// filtros por tiempo
			const sfecha            = verb_utils.getParam(req, 'sfecha', false)
			const fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
			const fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')

			var filter_time = false;

			const tfilters    = verb_utils.getParam(req, 'tfilters')
			debug(tfilters)

			const fossil = verb_utils.getParam(req, 'fossil', false)

			const start_year = verb_utils.getParam(req, 'start_year', 0)
			const end_year = verb_utils.getParam(req, 'end_year', 9999)

			const n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', 'full')
			debug("N mode: " + n_grid_coverage)

			const min_occ = verb_utils.getParam(req, 'min_occ', 0)
			debug("min_occ: " + min_occ)

			const alpha = verb_utils.getParam(req, 'alpha', 0.00001)
			debug("alpha: " + alpha)

			var n = -1
			var n_sp = -1
			var var_name = -1
			pool.task(t => {
				return  t.one("SELECT count(*) AS n FROM (SELECT DISTINCT $1:raw FROM snib WHERE $2:raw = $3) AS s",
						[res_celda_snib, covar_tax_level, covar_tax_name])
						.then(res => {
							n = res.n
							return t.one("SELECT especievalidabusqueda AS var_name FROM sp_snib WHERE spid = $1",
								[sp_id])
							.then(res => {
								var_name = res.var_name
								return t.any(queries.getGeoRelNiche.getBioScores, {
								  spid: sp_id,
								  N: n,
								  alpha: alpha,
								  min_occ: min_occ,
								  fossil: fossil,
								  sfecha: sfecha,
								  res_celda_sp: res_celda_sp,
								  res_celda_snib: res_celda_snib,
								  res_celda_snib_tb: res_celda_snib_tb, 
								  discardedDeleted: discardedDeleted,
								  lim_inf: fecha_incio.format('YYYY'),
								  lim_sup: fecha_fin.format('YYYY'),
								  n_grid_coverage: n_grid_coverage,
								  covar_tax_level: covar_tax_level,
								  covar_tax_name: covar_tax_name
								})			    
							})
						})
			})
			.then(data => {
				data.forEach(function(e) { 
					e.p_i = (1.0 * e.ni) / n;
					e.p_ij = (1.0 * e.nij) / e.nj;
					e.epsilon = e.nj * (e.p_ij - e.p_i) / Math.sqrt(e.nj * e.p_i * (1 - e.p_i))
					e.odds = ((1.0 * e.nij + alpha) / (e.ni + 2 * alpha)) * Math.pow((e.nj - 1.0 * e.nij + 0.5 * alpha) / (n - e.ni + alpha), -1)
					e.score = Math.log(e.odds)						
				})
				res.json({'data': data, 'grid_res': grid_res, 'N': parseInt(n), 'var_name': var_name})
			})
	  		.catch(err => {
				debug(err)
				next(err)
			})			
		}
		catch(error) {
			debug(error);
		}

	} else {
		debug("next")
		next()
	}
}

function getHelloMessage(req, res, next) {
	debug("Hello")
	res.json({'msg': 'bio_scores endpoint listening'})
}

/**
 * Esta variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getScoreDecilNiche. Actualmente el flujo es 
 * getScoreDecilNiche_A, getScoreDecilNiche_V, getScoreDecilNiche_T y 
 * getScoreDecilNiche.
 *
 * @see controllers/getBioScores
 */
exports.pipe = [
	getBioScores,
	getHelloMessage
]
