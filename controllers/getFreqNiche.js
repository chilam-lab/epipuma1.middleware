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
var moment = require('moment')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')
var pool = verb_utils.pool

var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha

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
  var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  
  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')

  // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

  // debug("n_grid_coverage: " + n_grid_coverage)
  // debug(sfosil)
  // debug(lb_fosil)
  // debug("iterations: " + iter)
  // debug("idtabla: " + idtabla)


  if (hasBios === 'true' && hasRaster === 'true' ) {
    debug('T')
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqNiche.getFreq, {
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

    pool.any(queries.getFreqNiche.getFreqBio, {
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
    debug('getFreqNiche endpoint listening')

    res.json(
      { 
        message: 'getFreq endpoint listening, please add the minimum parameters to get a response. See the example parameter',
        example: {
          id: 27332,
          fossil:"true",
          sfecha:"true",
          val_process:"false",
          idtabla: "no_table",
          grid_res: "16",
          tfilters: [{
            field:"clasevalida", 
            value:"Mammalia", 
            type:"4"
          }],
          hasBios:"true",
          hasRaster:"false"
        }
      }
    )

  }
}


/**
 * Está variable es un arreglo donde se define el flujo que debe de tener una 
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
  // getFreqNiche_T,
  getFreqNiche    
]

