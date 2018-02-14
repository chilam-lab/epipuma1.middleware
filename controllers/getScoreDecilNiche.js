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
var moment = require('moment')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha


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

  var filter_time = false;

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  
   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var sfosil        = verb_utils.getParam(req, 'fossil', false)

  var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  var val_process = verb_utils.getParam(req, 'val_process', false)
  var iter =  val_process === "true" ? iterations : 1

  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""
  
  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var apriori         = verb_utils.getParam(req, 'apriori')
  var groupid        = verb_utils.getParam(req, 'groupid')
  var title_valor = verb_utils.processTitleGroup(groupid, tfilters)
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  // debug(idtabla)
  // debug(sfosil)
  // debug("n_grid_coverage: " + n_grid_coverage)

    
  if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ) {
    debug('TA')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)


    pool.any(queries.getScoreDecilNiche.getScoreDecilA, {
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

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getScoreDecilNiche.getScoreDecilBioA, {
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

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getScoreDecilNiche.getScoreDecilRaA, {
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

  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";

  var val_process = verb_utils.getParam(req, 'val_process', false)
  var iter =  val_process === "true" ? iterations : 1
  
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

  // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  filter_time = false;

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var groupid        = verb_utils.getParam(req, 'groupid')

  var title_valor = verb_utils.processTitleGroup(groupid, tfilters)


  // debug("n_grid_coverage: " + n_grid_coverage)
  // debug(idtabla)
  // debug(sfosil)

  if (hasBios === 'true' && hasRaster === 'true' ) {
    
    debug('T')
    
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)


    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    debug("whereVar: " + whereVar)
    debug("whereVarRaster: " + whereVarRaster)
    

    pool.any(queries.getScoreDecilNiche.getScoreDecil, {
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
        for(var i = 0; i < data.length; i++){
          var item = data[i]
          item['title'] = title_valor
        }
        // debug(data)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

  } else if (hasBios === 'true') {
    debug('B')
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)



    pool.any(queries.getScoreDecilNiche.getScoreDecilBio, {
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
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getScoreDecilNiche.getScoreDecilRaster, {
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
  // getScoreDecil_VTA,
  // getScoreDecil_VT,
  // getScoreDecil_VA,
  // getScoreDecil_TA,
  getScoreDecilNiche_A,
  // getScoreDecilNiche_V,
  // getScoreDecilNiche_T,
  getScoreDecilNiche   
]

