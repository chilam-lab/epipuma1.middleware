/**
* ENG: This verb obtains epsilon and score values by specie.
*
* ESP: Este verbo es responsable de obtener los valores de epsilon y score por especie.
*
* @module controllers/getGeoRelNiche
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getGeoRelNiche')
var moment = require('moment')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool = verb_utils.pool

var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha


/**
 * ENG: This method obtains epsilon and score values by specie. The results are based on a target species and a group of variables given.
 *
 * ESP: Obtiene epsilon y score de la selección de especie objetivo y conjunto de variables bióticas y abióticas.
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getGeoRelNiche(req, res, next) {

  debug('getGeoRelNiche')

  var filter_time = false;

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var hasBios     = verb_utils.getParam(req, 'hasBios')
  var hasRaster   = verb_utils.getParam(req, 'hasRaster')
  var min_occ     = verb_utils.getParam(req, 'min_occ', 1)

  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')



  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 





  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])  
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

  // debug("n_grid_coverage: " + n_grid_coverage)
  // debug("sfosil: " + sfosil)
  // debug("iterations: " + iter)
  // debug("alpha: " + alpha)
  // debug("idtabla: " + idtabla)
    // debug("grid_resolution: " + grid_resolution)

    
  if (hasBios === 'true' && hasRaster === 'true' ){

    debug('T')
    
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getGeoRelNiche.getGeoRel, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla,
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
  else if (hasBios === 'true'){
    debug('B')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    debug(whereVar)

    pool.any(queries.getGeoRelNiche.getGeoRelBio, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla,
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
  else if (hasRaster === 'true'){
    debug('Ra')
   
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getGeoRelNiche.getGeoRelRaster, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config_raster: whereVarRaster,
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla,
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
  else{
    next()
  }
}


/**
 * ENG: This variable defines the order of methods to be executed when getGeoRelNiche verb is called.
 * 
 * ESP: Esta variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getGeoRelNiche.
 *
 */
exports.pipe = [
  getGeoRelNiche
]

