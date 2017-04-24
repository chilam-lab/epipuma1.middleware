/**
* Este verbo es responsable de obtener los valores de epsilon y score entre una
* especie objetivo y un conjunto de variables bióticas y raster.
*
* @module controllers/getScoreDecilNiche
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getScoreDecilNiche')
var pgp = require('pg-promise')()
var moment = require('moment')

var config = require('../config')
var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool= pgp(config.db)
var N = verb_utils.N 


/**
 * Obtiene el score por celda agrupado por decil con apriori
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getScoreDecilNiche_A(req, res, next) {
  debug('getScoreDecilNiche_A')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
  // var N           = 14707
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var apriori         = verb_utils.getParam(req, 'apriori')

  var groupid        = verb_utils.getParam(req, 'groupid')

  var title_valor = verb_utils.processTitleGroup(groupid, tfilters)

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
    
  if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ) {
    debug('TA')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getScoreDecilNiche.getScoreDecilA, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasBios === 'true' && apriori === 'apriori' ) {
    debug('BA')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getScoreDecilNiche.getScoreDecilBioA, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasRaster === 'true' && apriori === 'apriori' ) {
    debug('RaA')

    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getScoreDecilNiche.getScoreDecilRaA, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else {
    next()
  }
}


/**
 * Obtiene el score por celda agrupado por decil con validacion.
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getScoreDecilNiche_V(req, res, next) {
  debug('getScoreDecilNiche_V')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
  // var N           = 14707; // Verificar N, que se esta contemplando
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)
  var groupid        = verb_utils.getParam(req, 'groupid')

  var title_valor = verb_utils.processTitleGroup(groupid, tfilters)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var discardedids    = verb_utils.getParam(req, 'discardedids', [])

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  // debug(discardedids)
    
  if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ) {
    debug('V')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getScoreDecilNiche.getScoreDecilV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      arg_gridids: discardedids.toString(),
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ) {
    debug('B')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)

    pool.any(queries.getScoreDecilNiche.getScoreDecilBioV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      arg_gridids: discardedids.toString(),
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ) {
    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getScoreDecilNiche.getScoreDecilRaV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      arg_gridids: discardedids.toString(),
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else {
    next()
  }
}


/**
 * Obtiene el score por celda agrupado por decil con filtro temporal
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getScoreDecilNiche_T(req, res, next) {
  debug('getScoreDecilNiche_T')

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
  var groupid        = verb_utils.getParam(req, 'groupid')

  var title_valor = verb_utils.processTitleGroup(groupid, tfilters)
    
  // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')
  // debug(discardedFilterids)

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
    
  if (hasBios === 'true' && hasRaster === 'true' && discardedFilterids === 'true') {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('T')  

    whereVar = verb_utils.processBioFilters(tfilters, spid)
    whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getScoreDecilNiche.getScoreDecilT, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasBios === 'true' && discardedFilterids === 'true' ) {
    debug('B')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)  

    whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)
      
    pool.any(queries.getScoreDecilNiche.getScoreDecilBioT, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasRaster === 'true' && discardedFilterids === 'true' ) {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('Ra')

    whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getScoreDecilNiche.getScoreDecilRaT, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else {
    next()
  }
}


/**
 * Obtiene el score por celda agrupado por decil sin filtros
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getScoreDecilNiche(req, res, next) {
  debug('getScoreDecilNiche')

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
  var groupid        = verb_utils.getParam(req, 'groupid')

  var title_valor = verb_utils.processTitleGroup(groupid, tfilters)
    
  if (hasBios === 'true' && hasRaster === 'true' ) {
    debug('T')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getScoreDecilNiche.getScoreDecil, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasBios === 'true') {
    debug('B')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)

    pool.any(queries.getScoreDecilNiche.getScoreDecilBio, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if (hasRaster === 'true') {
    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getScoreDecilNiche.getScoreDecilRaster, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else {
    next()
  }
}


/**
 * Está variable es un arreglo donde se define el flujo que debe de tener una 
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
  // getScoreDecil_VTA,
  // getScoreDecil_VT,
  // getScoreDecil_VA,
  // getScoreDecil_TA,
  getScoreDecilNiche_A,
  getScoreDecilNiche_V,
  getScoreDecilNiche_T,
  getScoreDecilNiche   
]

