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
var debug = require('debug')('verbs:getScoreDecilMd')
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
exports.getScoreDecil = function(req, res, next) {
  
  debug('getScoreDecil')

  var filter_time = false;

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi_contour" 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  
   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var sfosil            = verb_utils.getParam(req, 'fossil', false)

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
  if(groupid != undefined || tfilters != undefined){
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters)  
  }
  
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])


  debug("lb_fosil: " + lb_fosil)

  
  if (hasBios === 'true' && hasRaster === 'false' ) {

    debug('Caso: hasbio:true - hasRaster:false')

    var caso_filtro_temporal = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso_filtro_temporal)


    var filter_time = caso_filtro_temporal !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)


    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    debug('whereVar: ' + whereVar)
    

    var g_source, g_target;

    // Inica tarea
    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            res_celda_snib_tb: res_celda_snib_tb

        }).then(resp => {

            debug("N:" + resp.n)

            // seleccion de caso para obtener datos de especie ibjetivo
            if(caso_filtro_temporal === -1 && lb_fosil.length == 0){
              debug("counts case 1: basico")
              // query_source = queries.basicAnalysis.getSource  
              query = queries.basicAnalysis.getCounts
            }
            else if(caso_filtro_temporal === -1 && lb_fosil.length > 1){
              debug("counts case 2: sin fosil")
              // query = queries.basicAnalysis.getSourceFossil
              query = queries.basicAnalysis.getCountsFossil
            }
            else{
              debug("counts case 3: tiempo y posible fosil")
              // query = queries.basicAnalysis.getSourceTime  
              query = queries.basicAnalysis.getCountsTime
            }

            return t.any(query, {
              spid: spid,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              min_occ: min_occ,
              N: resp.n,
              alpha: alpha,
              caso: caso_filtro_temporal,
              lim_inf: fecha_incio.format('YYYY'),
              lim_sup: fecha_fin.format('YYYY'),
              fosil: lb_fosil,
              whereVar: whereVar
            })

          })
        

    })
    .then(data => {
        res.json({
          ok: true,
          data: data,
          usuarioRequest: req.usuarioRequest
        });
    })
    .catch(error => {
        debug(error)
        return res.json({
          ok: false,
          error: error
        });
    });

  }
  else{

    return res.status(400).send({
        ok: false,
        message: "Error en petición"});
  }

}

