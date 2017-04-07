/**
* getGridSpeciesNiche module
*
* Este verbo obtiene el score por celda agrupado por decil 
*
* @module controllers/getGridSpeciesNiche
*/
var debug = require('debug')('verbs:getGridSpeciesNiche')
var pgp = require('pg-promise')()
var moment = require('moment')
var verb_utils = require('./verb_utils')

var config = require('../config')
var queries = require('./sql/queryProvider')

var pool= pgp(config.db)
var N = verb_utils.N 

/******************************************************************** getGridSpeciesNiche */



/**
 *
 * getGridSpeciesNiche_M de SNIB DB, con mapa prob
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

function getGridSpeciesNiche_M(req, res, next) {

  debug('getGridSpeciesNiche_M')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
    // var N           = 14707
  var maxscore    = 700
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

    // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

    // variables configurables
  var hasBios     = verb_utils.getParam(req, 'hasBios')
  var hasRaster   = verb_utils.getParam(req, 'hasRaster')
  var lat         = verb_utils.getParam(req, 'lat')
  var long        = verb_utils.getParam(req, 'long')

  var mapa_prob       = verb_utils.getParam(req, 'mapa_prob')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

    
  if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

    debug('T')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesM, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ){

    debug('B')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioM, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

    pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaM, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
 *
 * getGridSpeciesNiche_A de SNIB DB, apriori
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

function getGridSpeciesNiche_A(req, res, next) {

  debug('getGridSpeciesNiche_A')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
    // var N           = 14707
  var maxscore    = 700
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

    // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

    // variables configurables
  var hasBios     = verb_utils.getParam(req, 'hasBios')
  var hasRaster   = verb_utils.getParam(req, 'hasRaster')
  var lat         = verb_utils.getParam(req, 'lat')
  var long        = verb_utils.getParam(req, 'long')
  var apriori     = verb_utils.getParam(req, 'apriori')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

    debug('T')

    var whereVar  = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  else if (hasBios === 'true' && apriori === 'apriori' ){

    debug('B')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

    pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  else if (hasRaster === 'true' && apriori === 'apriori' ){

    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

    pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
 *
 * getGridSpeciesNiche_T de SNIB DB
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

function getGridSpeciesNiche_T(req, res, next) {

  debug('getGridSpeciesNiche_T')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
  var maxscore    = 700
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

    // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

    // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')

  var lat      = verb_utils.getParam(req, 'lat')
  var long      = verb_utils.getParam(req, 'long')
    
    // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

    // debug(discardedFilterids)

    
  if (hasBios === 'true' && hasRaster === 'true' && discardedFilterids === 'true'){

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      // debug(caso)


    debug('T')  

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
    var categorias = verb_utils.getRasterCategories(tfilters)


    debug('Ra')

    whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
 *
 * getGridSpeciesNiche de SNIB DB
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

function getGridSpeciesNiche(req, res, next) {

  debug('getGridSpeciesNiche')

    
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
    // var N           = 14707
  var maxscore    = 700
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

    // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

    // variables configurables
  var hasBios     = verb_utils.getParam(req, 'hasBios')
  var hasRaster   = verb_utils.getParam(req, 'hasRaster')

  var lat      = verb_utils.getParam(req, 'lat')
  var long      = verb_utils.getParam(req, 'long')

    // debug(idGrid)
    // var groupid        = verb_utils.getParam(req, 'groupid')
    // var title_valor = verb_utils.processTitleGroup(groupid, tfilters)
    
  if (hasBios === 'true' && hasRaster === 'true'){

    debug('T')
      
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)

      // debug(categorias)

    pool.any(queries.getGridSpeciesNiche.getGridSpecies, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  else if (hasBios === 'true'){

    debug('B')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
    pool.any(queries.getGridSpeciesNiche.getGridSpeciesBio, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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
  else if (hasRaster === 'true'){

    debug('Ra')

      // debug(tfilters)

      
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    var categorias = verb_utils.getRasterCategories(tfilters)
      
      // debug(whereVarRaster)

    pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaster, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      long: long,
      lat: lat,
      categorias: categorias,
      maxscore: maxscore,
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

exports.pipe = [
  getGridSpeciesNiche_M,
  getGridSpeciesNiche_A,
  getGridSpeciesNiche_T,
  getGridSpeciesNiche        
]
