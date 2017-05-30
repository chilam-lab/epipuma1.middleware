/**
* Este verbo es responsable de obtener los valores de epsilon y score entre una
* especie objetivo y un conjunto de variables bióticas y raster.
*
* @module controllers/getFreqCeldaNiche
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getFreqCeldaNiche')
var pgp = require('pg-promise')()
var moment = require('moment')

var config = require('../config')
var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool= pgp(config.db)
var N = verb_utils.N 


/**
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin 
 * utilzar filtros con a priori
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqCeldaNiche_A(req, res, next) {
  debug('getFreqCeldaNiche_A')
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
  // var N           = 14707
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var apriori         = verb_utils.getParam(req, 'apriori')
    
  if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ) {
    debug('TA')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqCeldaNiche.getFreqCeldaA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  }
  else if (hasBios === 'true' && apriori === 'apriori' ) {
    debug('BA')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else if (hasRaster === 'true' && apriori === 'apriori' ) {
    debug('RaA')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else{
    next()
  }
}


/**
 * Obtiene la frecuencia del score por celda obtenido de las especies con 
 * validación
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */

function getFreqCeldaNiche_V(req, res, next) {
  debug('getFreqCeldaNiche_V')
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
  // var N           = 14707; // Verificar N, que se esta contemplando
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var discardedids    = verb_utils.getParam(req, 'discardedids', [])

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  // debug(discardedids)
    
  if ( hasBios === 'true' && hasRaster === 'true' && 
       discardedids != undefined && discardedids.length > 0 ) {
    debug('V')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqCeldaNiche.getFreqCeldaV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      arg_gridids: discardedids,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasBios === 'true' && discardedids != undefined && 
	     discardedids.length > 0 ) {
    debug('B')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)

    pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      arg_gridids: discardedids,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        // debug(data.length)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasRaster === 'true' && discardedids != undefined && 
	     discardedids.length > 0 ){
    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      arg_gridids: discardedids,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else{
    next()
  }
}


/**
 * Obtiene la frecuencia del score por celda obtenido de las especies con un 
 * filtro temporal
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqCeldaNiche_T(req, res, next) {
  debug('getFreqCeldaNiche_T')
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
  // var N           = 14707; // Verificar N, que se esta contemplando
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
    
  // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), 
				 ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', 
						     moment().
						     format('YYYY-MM-DD') ), 
				 ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  // debug(discardedFilterids)

  if (hasBios === 'true' && hasRaster === 'true' && 
      discardedFilterids === 'true') {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('T')  
    whereVar = verb_utils.processBioFilters(tfilters, spid)
    whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getFreqCeldaNiche.getFreqCeldaT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        // debug(data)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  }
  else if (hasBios === 'true' && discardedFilterids === 'true' ){
    debug('B')
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)  

    whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)
      
    pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        // debug(data)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else if (hasRaster === 'true' && discardedFilterids === 'true' ){
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('Ra')
    whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        // debug(data)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else{
    next()
  }
}



/**
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin 
 * utilzar filtros
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqCeldaNiche(req, res, next) {
  debug('getFreqCeldaNiche')
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
  // var N           = 14707
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
    
  if (hasBios === 'true' && hasRaster === 'true' ) {
    debug('T')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqCeldaNiche.getFreqCelda, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  }
  else if (hasBios === 'true') {
    debug('B')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)

    pool.any(queries.getFreqCeldaNiche.getFreqCeldaBio, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
  } 
  else if (hasRaster === 'true') {
    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaster, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else{
    next()
  }
}


/**
 * Esta variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getFreqCeldaNiche. Actualmente el flujo es 
 * getFreqCeldaNiche_A,
 * getFreqCeldaNiche_V, getFreqCeldaNiche_T y getFreqCeldaNiche.
 *
 * @see controllers/getFreqCeldaNiche~getFreqCeldaNiche_A
 * @see controllers/getFreqCeldaNiche~getFreqCeldaNiche_V
 * @see controllers/getFreqCeldaNiche~getFreqCeldaNiche_T
 * @see controllers/getFreqCeldaNiche~getFreqCeldaNiche
 */
exports.pipe = [
  // getFreqCelda_VTA,
  // getFreqCelda_VA,
  // getFreqCelda_VT,
  // getFreqCelda_TA,
  getFreqCeldaNiche_A,
  getFreqCeldaNiche_V,
  getFreqCeldaNiche_T,
  getFreqCeldaNiche    
]
