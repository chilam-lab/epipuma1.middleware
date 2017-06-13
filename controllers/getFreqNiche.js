/**
* Este verbo obtiene y devuelve la frecuencia de epsilon y el score por
* especie
*
* @module controllers/getFreqNiche  
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getFreqNiche')
var pgp = require('pg-promise')()
var moment = require('moment')

var config = require('../config')
var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool= pgp(config.db)
var N = verb_utils.N 
var iterations = verb_utils.iterations



/**
 * Obtiene frecuencia de epsilon y score por especie con validación y tiempo.
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
// function getFreqNiche_VT(req, res, next) {
//   debug('getFreqNiche_VT')
//   var spid        = parseInt(verb_utils.getParam(req, 'id'))
//   var tfilters    = verb_utils.getParam(req, 'tfilters')
//   var alpha       = 0.01
//   var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
//   var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

//   // Siempre incluidos en query, nj >= 0
//   var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

//   // variables configurables
//   var hasBios         = verb_utils.getParam(req, 'hasBios')
//   var hasRaster       = verb_utils.getParam(req, 'hasRaster')
//   var discardedids    = verb_utils.getParam(req, 'discardedids', [])

//   var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

//   // filtros por tiempo
//   var sfecha        = verb_utils.getParam(req, 'sfecha', false)
//   var fecha_incio   = moment(verb_utils.getParam(req, 'lim_inf', '1500'), 
//                              ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
//   var fecha_fin     = moment(verb_utils.getParam(req, 'lim_sup',
//                                                  moment().format('YYYY-MM-DD')),
//                                  ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
//   var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')
//   // debug(discardedFilterids)

//   if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined 
//        && discardedids.length > 0 && discardedFilterids === 'true' ) {

//     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
//     debug(caso)

//     debug('V')
//     var whereVar = verb_utils.processBioFilters(tfilters, spid)
//     var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

//     pool.any(queries.getFreqNiche.getFreqVT, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config: whereVar,
//       where_config_raster: whereVarRaster,
//       arg_gridids: discardedids,
//       lim_inf: fecha_incio.format('YYYY'),
//       lim_sup: fecha_fin.format('YYYY'),
//       caso: caso,
//       res_celda: res_celda,
//       res_grid: res_grid,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   }
//   else if (hasBios === 'true' && discardedids != undefined && 
//            discardedids.length > 0 && discardedFilterids === 'true' ) {

//     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
//     debug(caso)

//     debug('B')
//     var whereVar = verb_utils.processBioFilters(tfilters, spid)
//     // debug(whereVar)

//     pool.any(queries.getFreqNiche.getFreqBioVT, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config: whereVar,
//       arg_gridids: discardedids,
//       lim_inf: fecha_incio.format('YYYY'),
//       lim_sup: fecha_fin.format('YYYY'),
//       caso: caso,
//       res_celda: res_celda,
//       res_grid: res_grid,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         // debug(data.length)
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   } 
//   else if (hasRaster === 'true' && discardedids != undefined && 
//            discardedids.length > 0 && discardedFilterids === 'true' ) {

//     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
//     debug(caso)

//     debug('Ra')
//     var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
//     // debug(whereVarRaster)

//     pool.any(queries.getFreqNiche.getFreqRaVT, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config_raster: whereVarRaster,
//       arg_gridids: discardedids,
//       lim_inf: fecha_incio.format('YYYY'),
//       lim_sup: fecha_fin.format('YYYY'),
//       caso: caso,
//       res_celda: res_celda,
//       res_grid: res_grid,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   } 
//   else{
//     next()
//   }
// }


/**
 * Obtiene frecuencia de epsilon y score por especie con validaciÃ³n.
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
// function getFreqNiche_V(req, res, next) {

//   debug('getFreqNiche_V')

//   var spid        = parseInt(verb_utils.getParam(req, 'id'))
//   var tfilters    = verb_utils.getParam(req, 'tfilters')
//   var alpha       = 0.01
//   // var N           = 14707; // Verificar N, que se esta contemplando
//   var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')

//   // Siempre incluidos en query, nj >= 0
//   var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

//   // variables configurables
//   var hasBios         = verb_utils.getParam(req, 'hasBios')
//   var hasRaster       = verb_utils.getParam(req, 'hasRaster')
//   var discardedids    = verb_utils.getParam(req, 'discardedids', [])

//   var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
//   // debug(discardedids)
    
//   if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined
//        && discardedids.length > 0 ) {
//     debug('V')
//     var whereVar = verb_utils.processBioFilters(tfilters, spid)
//     var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

//     pool.any(queries.getFreqNiche.getFreqV, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config: whereVar,
//       where_config_raster: whereVarRaster,
//       arg_gridids: discardedids,
//       res_celda: res_celda,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   }
//   else if (hasBios === 'true' && discardedids != undefined && 
//            discardedids.length > 0 ) {
//     debug('B')
//     var whereVar = verb_utils.processBioFilters(tfilters, spid)
//     // debug(whereVar)

//     pool.any(queries.getFreqNiche.getFreqBioV, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config: whereVar,
//       arg_gridids: discardedids,
//       res_celda: res_celda,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         // debug(data.length)
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   } 
//   else if (hasRaster === 'true' && discardedids != undefined && 
//            discardedids.length > 0 ) {
//     debug('Ra')
//     var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
//     // debug(whereVarRaster)

//     pool.any(queries.getFreqNiche.getFreqRasterV, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config_raster: whereVarRaster,
//       arg_gridids: discardedids,
//       res_celda: res_celda,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   } 
//   else{
//     next()
//   }
// }


/**
 * Obtiene frecuencia de epsilon y score por especie con filtro temporal
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqNiche_T(req, res, next) {
  debug('getFreqNiche_T')
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
  var sfecha       = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio  = moment(verb_utils.getParam(req, 'lim_inf', '1500'),
                            ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin    = moment(verb_utils.getParam(req, 'lim_sup', 
                                                moment().format('YYYY-MM-DD')),
                            ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  debug("iterations: " + iter)

  // debug(discardedFilterids)
    
  if (hasBios === 'true' && hasRaster === 'true' && discardedFilterids === 'true') {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('T')  
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getFreqNiche.getFreqT, {
      iterations: iter,
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
      
    pool.any(queries.getFreqNiche.getFreqBioT, {
      iterations: iter,
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
      
    pool.any(queries.getFreqNiche.getFreqRasterT, {
      iterations: iter,
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
 * Obtiene frecuencia de epsilon y score por especie sin ningÃºn filtro
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqNiche(req, res, next) {
  debug('getFreqNiche')
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
  // var N           = 14707; // Verificar N, que se esta contemplando
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  debug("iterations: " + iter)


  if (hasBios === 'true' && hasRaster === 'true' ) {
    debug('T')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqNiche.getFreq, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
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
  else if (hasBios === 'true'){
    debug('B')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getFreqNiche.getFreqBio, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      res_celda: res_celda,
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
  else if (hasRaster === 'true'){
    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getFreqNiche.getFreqRaster, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
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
 * EstÃ¡ variable es un arreglo donde se define el flujo que debe de tener una 
 * peticiÃ³n al verbo getFreqNiche. Actualmente el flujo es getFreqNiche_VT,
 * getFreqNiche_V, getFreqNiche_T y getFreqNiche.
 *
 * @see controllers/getFreqNiche~getFreqNiche_VT
 * @see controllers/getFreqNiche~getFreqNiche_V
 * @see controllers/getFreqNiche~getFreqNiche_T
 * @see controllers/getFreqNiche~getFreqNiche
 */
exports.pipe = [
  // getFreqNiche_VT,
  // getFreqNiche_V,
  getFreqNiche_T,
  getFreqNiche    
]

