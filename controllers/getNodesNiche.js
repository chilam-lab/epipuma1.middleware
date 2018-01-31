/**
* Este verbo 
*
* @module controllers/getNodesNiche
* @requires debug
* @requires pg-promise
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getNodesNiche')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 
var N = verb_utils.N 
var alpha = verb_utils.alpha


/**
 * Servidor Niche: getNodesNiche
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getNodesNiche(req, res, next) {
  debug('getNodesNiche')

  var sfilters    = verb_utils.getParam(req, 's_tfilters')
  // debug(sfilters)
  var tfilters    = verb_utils.getParam(req, 't_tfilters')
  // debug(tfilters)
  var min_occ     = verb_utils.getParam(req, 'min_occ', 1)
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')

  // var alpha       = 0.01
  // var N           = 14707
  var min_ep      = 0.0
  var max_edges   = 1000

  var hasBiosSource    = verb_utils.getParam(req, 'hasbiosource')
  var hasRasterSource    = verb_utils.getParam(req, 'hasrastersource')
  var hasBiosTarget    = verb_utils.getParam(req, 'hasbiotarget')
  var hasRasterTarget    = verb_utils.getParam(req, 'hasrastertarget')

  // debug(hasBiosSource)
  // debug(hasRasterSource)
  // debug(hasBiosTarget)
  // debug(hasRasterTarget)
 
  // debug("validaciones")
  // debug(hasBiosSource === true)
  // debug(hasBiosTarget === true)
  // debug(hasRasterSource === true)
  // debug(hasRasterTarget === true)

  if ( hasBiosSource === true && hasBiosTarget === true && 
       hasRasterSource === true && hasRasterTarget === true ) {
    debug('hasBiosSource - hasBiosTarget - hasRasterSource - hasRasterTarget')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getNodesNiche.getNodesNicheBioRaster_BioRaster, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if ( hasBiosSource === true && hasRasterSource === true && 
              hasBiosTarget === true ) {
    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getNodesNiche.getNodesNicheBioRaster_Bio, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      res_celda: res_celda
      // where_config_target_raster: whereVarTargetRaster
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if ( hasBiosSource === true && hasRasterSource === true && 
              hasRasterTarget === true ) {
    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    // var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getNodesNiche.getNodesNicheBioRaster_Raster, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      // where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if ( hasBiosSource === true && hasBiosTarget === true && 
              hasRasterTarget === true ) {
    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getNodesNiche.getNodesNicheBio_BioRaster, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if ( hasRasterSource === true && hasBiosTarget === true && 
              hasRasterTarget === true ) {
    debug('T')
    // var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getNodesNiche.getNodesNicheRaster_BioRaster, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      // where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if ( hasBiosSource === true && hasBiosTarget === true ) {
    debug('hasBiosSource - hasBiosTarget')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    // debug(whereVarSource)
    // debug(whereVarTarget)
    debug(alpha)

    pool.any(queries.getNodesNiche.getNodesNicheBio_Bio, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
      // where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      res_celda: res_celda
      // where_config_target_raster: whereVarTargetRaster
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if ( hasBiosSource === true && hasRasterTarget === true ) {
    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)
    // var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getNodesNiche.getNodesNicheBio_Raster, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
      // where_config_source_raster: whereVarSourceRaster,
      // where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if ( hasRasterSource === true && hasBiosTarget === true ) {
    debug('T')
    // var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getNodesNiche.getNodesNicheRaster_Bio, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      // where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      res_celda: res_celda
      // where_config_target_raster: whereVarTargetRaster
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } else if ( hasRasterSource === true && hasRasterTarget === true ) {
    debug('T')
    // var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    // var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    // debug(whereVarSourceRaster)
    // debug(whereVarTargetRaster)

    pool.any(queries.getNodesNiche.getNodesNicheRaster_Raster, {
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      // where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      // where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda
    })
      .then(function (data) {
        // debug(data)
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
 * Esta variable es un arreglo donde se define el flujo que debe de tomar una
 * petición al verbo getNodesNiche. Actualmente solo consta de un elemento, 
 * getNodeNiche.
 *
 * @see controllers/getNodesNiche~GetNodeNiche
 */
exports.pipe = [getNodesNiche]

