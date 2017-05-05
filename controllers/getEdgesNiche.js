/**
* getEdgesNiche module
*
* Este verbo 
*
* @module controllers/getEdgesNiche
*/
var debug = require('debug')('verbs:getEdgesNiche')
var pgp = require('pg-promise')()
var verb_utils = require('./verb_utils')

var config = require('../config')
var queries = require('./sql/queryProvider')

var pool= pgp(config.db)
var N = verb_utils.N 


/**
 *
 * Servidor Niche: getEdgesNiche
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


function getEdgesNiche(req, res, next) {

  
  debug('getEdgesNiche')

    // var spids = verb_utils.getParam(req, 'spids')
  var sfilters    = verb_utils.getParam(req, 's_tfilters')
  var tfilters    = verb_utils.getParam(req, 't_tfilters')
  var alpha       = 0.01
    // var N           = 14707
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')


  var min_ep = 0.0
  var max_edges = 1000

  var hasBiosSource    = verb_utils.getParam(req, 'hasbiosource')
  var hasRasterSource    = verb_utils.getParam(req, 'hasrastersource')
  var hasBiosTarget    = verb_utils.getParam(req, 'hasbiotarget')
  var hasRasterTarget    = verb_utils.getParam(req, 'hasrastertarget')



  if ( hasBiosSource === true && hasBiosTarget === true && hasRasterSource === true && hasRasterTarget === true ){

    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_BioRaster, {
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

      
  }
  else if ( hasBiosSource === true && hasRasterSource === true && hasBiosTarget === true ){

    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


    pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_Bio, {
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

      
  }
  else if ( hasBiosSource === true && hasRasterSource === true && hasRasterTarget === true ){

    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        
    pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_Raster, {
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

      
  }
  else if ( hasBiosSource === true && hasBiosTarget === true && hasRasterTarget === true ){

    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)



    pool.any(queries.getEdgesNiche.getEdgesNicheBio_BioRaster, {
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

      
  }
  else if ( hasRasterSource === true && hasBiosTarget === true && hasRasterTarget === true ){

    debug('T')
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)



    pool.any(queries.getEdgesNiche.getEdgesNicheRaster_BioRaster, {
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

      
  }
  else if ( hasBiosSource === true && hasBiosTarget === true ){

    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


    pool.any(queries.getEdgesNiche.getEdgesNicheBio_Bio, {
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

      
  }
  else if ( hasBiosSource === true && hasRasterTarget === true ){

    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)
        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        
    pool.any(queries.getEdgesNiche.getEdgesNicheBio_Raster, {
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

      
  }
  else if ( hasRasterSource === true && hasBiosTarget === true ){

    debug('T')

    debug(sfilters)
    debug(tfilters)
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

        
        debug(whereVarSourceRaster)
        debug(whereVarTarget)

    pool.any(queries.getEdgesNiche.getEdgesNicheRaster_Bio, {
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
          // debug(data)

          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
  }
  else if ( hasRasterSource === true && hasRasterTarget === true ){

    debug('T')
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    // debug(whereVarTargetRaster)
    // debug(whereVarSourceRaster)


    pool.any(queries.getEdgesNiche.getEdgesNicheRaster_Raster, {
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

      
  }

  else{

    next()
  }


}

exports.pipe = [ getEdgesNiche ]
