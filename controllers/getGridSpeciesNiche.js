/**
* Este verbo obtiene el score por celda agrupado por decil 
*
* @module controllers/getGridSpeciesNiche
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getGridSpeciesNiche')
var moment = require('moment')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha
var maxscore = verb_utils.maxscore

/**
 * Obtiene el score por celda agrupado por decil con mapa de proabilidad
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getGridSpeciesNiche_M(req, res, next) {
  debug('getGridSpeciesNiche_M')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var filter_time = false;
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  
  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)
  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  var lb_fosil      = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')

  // variables configurables
  var hasBios     = verb_utils.getParam(req, 'hasBios')
  var hasRaster   = verb_utils.getParam(req, 'hasRaster')
  var lat         = verb_utils.getParam(req, 'lat')
  var long        = verb_utils.getParam(req, 'long')
  var mapa_prob       = verb_utils.getParam(req, 'mapa_prob')
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])


  // debug(sfosil)
  // debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  // debug("iterations: " + iter)
  // debug("idtabla: " + idtabla)
  // debug("n_grid_coverage: " + n_grid_coverage)

    
  if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){
    debug('T')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesM, {
     iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  } else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ) {
    debug('B')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioM, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  } else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ) {
    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

    pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaM, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  } else {
    next()
  }
}


/**
 * Obtiene el score por celda agrupado por decil con apriori
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getGridSpeciesNiche_A(req, res, next) {
  debug('getGridSpeciesNiche_A')

  var filter_time = false;

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)
  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  var lb_fosil      = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  
  // variables configurables
  var hasBios     = verb_utils.getParam(req, 'hasBios')
  var hasRaster   = verb_utils.getParam(req, 'hasRaster')
  var lat         = verb_utils.getParam(req, 'lat')
  var long        = verb_utils.getParam(req, 'long')
  var apriori     = verb_utils.getParam(req, 'apriori')
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  // debug(sfosil)
  // debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  // debug("iterations: " + iter)
  // debug("idtabla: " + idtabla)
  // debug("n_grid_coverage: " + n_grid_coverage)



  if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){
    debug('T')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar  = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesA, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  } else if (hasBios === 'true' && apriori === 'apriori' ) {
    debug('B')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

    pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioA, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  } else if (hasRaster === 'true' && apriori === 'apriori' ) {
    debug('Ra')


    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

    pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaA, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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

function getGridSpeciesNiche(req, res, next) {
  debug('getGridSpeciesNiche')

  var filter_time = false;

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)
  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  var lb_fosil      = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  // variables configurables
  var hasBios     = verb_utils.getParam(req, 'hasBios')
  var hasRaster   = verb_utils.getParam(req, 'hasRaster')
  var lat      = verb_utils.getParam(req, 'lat')
  var long      = verb_utils.getParam(req, 'long')


  // debug("n_grid_coverage: " + n_grid_coverage)
  // debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  // debug("iterations: " + iter)
  // debug("idtabla: " + idtabla)


  if (hasBios === 'true' && hasRaster === 'true') {
    debug('T')


    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)
      
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

    // debug(categorias)

    pool.any(queries.getGridSpeciesNiche.getGridSpecies, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  } else if (hasBios === 'true') {
    debug('B')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesBio, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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

      
  } else if (hasRaster === 'true') {
    debug('Ra')

    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    // debug(whereVarRaster)

    pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaster, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  } else {
    next()
  }
}


/**
 * EstÃ¡ variable es un arreglo donde se define el flujo que debe de tener una 
 * peticiÃ³n al verbo getGridSpeciesNiche. Actualmente el flujo es 
 * getGridSpeciesNiche_M, getGridSpeciesNiche_A, getGridSpeciesNiche_T y
 * getGridSpeciesNiche.
 *
 * @see controllers/getGridSpeciesNiche~getGridSpeciesNiche_VT
 * @see controllers/getGridSpeciesNiche~getGridSpeciesNiche_V
 * @see controllers/getGridSpeciesNiche~getGridSpeciesNiche_T
 * @see controllers/getGridSpeciesNiche~getGridSpeciesNiche
 */
exports.pipe = [
  getGridSpeciesNiche_M,
  getGridSpeciesNiche_A,
  // getGridSpeciesNiche_T,
  getGridSpeciesNiche        
]
