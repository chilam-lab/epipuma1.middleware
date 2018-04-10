/**
* getEdgesNiche module
*
* Este verbo 
*
* @module controllers/getEdgesNiche
*/
var debug = require('debug')('verbs:getEdgesNiche')
var verb_utils = require('./verb_utils')

var queries = require('./sql/queryProvider')
var pool = verb_utils.pool
var alpha = verb_utils.alpha
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
  
  // var alpha       = 0.01
    // var N           = 14707
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)
  // var res_celda_sp = verb_utils.getParam(req, 'res_celda_sp', 'cells_16km')
  // var res_celda_snib = verb_utils.getParam(req, 'res_celda_snib', 'gridid_16km')
  // var res_celda_snib_tb = verb_utils.getParam(req, 'res_celda_snib_tb', 'grid_16km_aoi')


  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 


  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  debug("n_grid_coverage: " + n_grid_coverage)

  // console.log(res_celda_sp);
  // console.log(res_celda_snib);
  // console.log(res_celda_snib_tb);
  // var min_ep = 0.0
  // var max_edges = 1000

  var hasBiosSource    = verb_utils.getParam(req, 'hasbiosource')
  var hasRasterSource    = verb_utils.getParam(req, 'hasrastersource')
  var hasBiosTarget    = verb_utils.getParam(req, 'hasbiotarget')
  var hasRasterTarget    = verb_utils.getParam(req, 'hasrastertarget')



  if ( hasBiosSource === true && hasBiosTarget === true && 
       hasRasterSource === true && hasRasterTarget === true ){

    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
    var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_BioRaster, {
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
    })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
  }
  else if ( hasBiosSource === true && hasRasterSource === true && 
            hasBiosTarget === true ){

    debug('T')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
    var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


    pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_Bio, {
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
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
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
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
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
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
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
          // where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
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

    debug('hasBiosSource & hasBiosTarget')
    var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

    var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

    // debug(whereVarSource)
    // debug(whereVarTarget)
    debug(alpha)

    pool.any(queries.getEdgesNiche.getEdgesNicheBio_Bio, {
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
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
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
      where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
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
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
      // where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
      where_config_target: whereVarTarget,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
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
      // N: N,
      res_celda_snib_tb: res_celda_snib_tb,
      res_celda_snib: res_celda_snib,
      alpha: alpha,
      min_occ: min_occ,
          // where_config_source: whereVarSource,
      where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
      where_config_target_raster: whereVarTargetRaster,
      res_celda: res_celda_sp,
      n_grid_coverage: n_grid_coverage
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
