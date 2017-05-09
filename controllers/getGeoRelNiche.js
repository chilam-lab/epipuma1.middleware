/**
* Este verbo es responsable de obtener los valores de epsilon y score entre una
* especie objetivo y un conjunto de variables bióoticas y raster.
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
var pgp = require('pg-promise')()
var moment = require('moment')

var config = require('../config')
var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool= pgp(config.db)
var N = verb_utils.N 


/**
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de 
 * variables bioticas y raster, con validación y tiempo.
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getGeoRelNiche_VT(req, res, next) {
  debug('getGeoRelNiche_VT')
  var spid = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters = verb_utils.getParam(req, 'tfilters')
  var alpha = 0.01
  // var N = 14707; // Verificar N, que se esta contemplando
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var discardedids    = verb_utils.getParam(req, 'discardedids', [])
  // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')
  // debug(discardedFilterids)

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  // debug(discardedFilterids)

  if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === 'true' ) {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('V')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getGeoRelNiche.getGeoRelVT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      arg_gridids: discardedids,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
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
  else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === 'true' ) {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('B')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)

    pool.any(queries.getGeoRelNiche.getGeoRelBioVT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      arg_gridids: discardedids,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
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
  } 
  else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === 'true' ) {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getGeoRelNiche.getGeoRelRaVT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      arg_gridids: discardedids,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
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
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de 
 * variables bioticas y raster, con validación
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getGeoRelNiche_V(req, res, next) {
  debug('getGeoRelNiche_V')
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
  var discardedids    = verb_utils.getParam(req, 'discardedids', [])

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  // debug(discardedFilterids)

  // debug(discardedids)
  if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ) {
    debug('V')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getGeoRelNiche.getGeoRelV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      arg_gridids: discardedids,
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
  else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ) {
    debug('B')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)

    pool.any(queries.getGeoRelNiche.getGeoRelBioV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      arg_gridids: discardedids,
      res_celda: res_celda,
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
  } 
  else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){
    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getGeoRelNiche.getGeoRelRaV, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      arg_gridids: discardedids,
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
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de 
 * variables bioticas y raster, con filtro temporal
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getGeoRelNiche_T(req, res, next) {
  debug('getGeoRelNiche_T')
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
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    
  var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

    // debug(discardedFilterids)
    // debug(sfecha)
    // debug(fecha_incio)
    // debug(fecha_fin)
    
  if (hasBios === 'true' && hasRaster === 'true' && discardedFilterids === 'true') {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug("caso: " + caso)

    debug('T')  

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getGeoRelNiche.getGeoRelT, {
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
  else if (hasBios === 'true' && discardedFilterids === 'true' ) {
    debug('B')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug("caso: " + caso)

    whereVar = verb_utils.processBioFilters(tfilters, spid)

    // debug(whereVar)

      
    pool.any(queries.getGeoRelNiche.getGeoRelBioT, {
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
  else if (hasRaster === 'true' && discardedFilterids === 'true' ) {
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug(caso)

    debug('Ra')

    whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getGeoRelNiche.getGeoRelRaT, {
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
 * Obtiene epsilon y score de la elación de especie objetivo y conjunto de 
 * variables bioticas y raster, sin filtros
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getGeoRelNiche(req, res, next) {
  debug('getGeoRelNiche')
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

    // console.log(discardedDeleted);

  
    // console.log(hasBios);
    // console.log(hasRaster);
    // console.log(spid);
    // console.log(tfilters);
    // console.log(min_occ);

  // debug(hasBios);
  // debug(hasRaster);
  // debug(spid);
  // debug(tfilters);
  // debug(min_occ);
    
  if (hasBios === 'true' && hasRaster === 'true' ){
    debug('T')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getGeoRelNiche.getGeoRel, {
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
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    // debug(whereVar)
    // debug(queries.getGeoRelNiche.getGeoRelBio)

    pool.any(queries.getGeoRelNiche.getGeoRelBio, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      res_celda: res_celda,
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
  else if (hasRaster === 'true'){
    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getGeoRelNiche.getGeoRelRaster, {
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
 * Está variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getGeoRelNiche. Actualmente el flujo es getGeoRelNiche_VT,
 * getGeoRelNiche_V, getGeoRelNiche_T y getGeoRelNiche.
 *
 * @see controllers/getGeoRelNiche~getGeoRelNiche_VT
 * @see controllers/getGeoRelNiche~getGeoRelNiche_V
 * @see controllers/getGeoRelNiche~getGeoRelNiche_T
 * @see controllers/getGeoRelNiche~getGeoRelNiche
 */
exports.pipe = [
  getGeoRelNiche_VT,
  getGeoRelNiche_V,
  getGeoRelNiche_T,
  getGeoRelNiche
]

