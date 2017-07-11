/**
* Este verbo es responsable de obtener los valores de epsilon y score entre una
* especie objetivo y un conjunto de variables bióticas y raster.
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
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha


/**
 * Obtiene epsilon y score de la elaciÃ³n de especie objetivo y conjunto de 
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
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)
  
  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  // debug(sfosil)
  var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  // debug(lb_fosil)


  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')


  // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  var filter_time = false;

 


  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  debug("iterations: " + iter)

  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""
  
    
  if (hasBios === 'true' && hasRaster === 'true' ){
    debug('T')
    
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    debug('res_celda: ' + res_celda)



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
      res_celda: res_celda,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
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

    res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    // res_celda = res_celda.replace("cells","gridid")
    debug('res_celda: ' + res_celda)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    debug(whereVar)

    // debug(queries.getGeoRelNiche.getGeoRelBio)

    pool.any(queries.getGeoRelNiche.getGeoRelBio, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
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
    
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    debug('res_celda: ' + res_celda)

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
      res_celda: res_celda,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
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
 * Esta variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getGeoRelNiche. Actualmente el flujo es getGeoRelNiche_VT,
 * getGeoRelNiche_V, getGeoRelNiche_T y getGeoRelNiche.
 *
 * @see controllers/getGeoRelNiche~getGeoRelNiche_VT
 * @see controllers/getGeoRelNiche~getGeoRelNiche_V
 * @see controllers/getGeoRelNiche~getGeoRelNiche_T
 * @see controllers/getGeoRelNiche~getGeoRelNiche
 */
exports.pipe = [
  // getGeoRelNiche_VT,
  // getGeoRelNiche_V,
  // getGeoRelNiche_T,
  getGeoRelNiche
]

