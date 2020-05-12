/**
* @module controllers/countsTaxonsGroupTimeValidation
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
**/
var debug = require('debug')('verbs:countsTaxonsGroupTimeValidation')
var moment = require('moment')
var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')
var pgp = require('pg-promise')
var d3 = require('d3')

var pool = verb_utils.pool 
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha
var buckets = verb_utils.buckets
var default_region = verb_utils.region_mx
var default_resolution = verb_utils.covid_mx
var max_score = verb_utils.maxscore
var min_score = verb_utils.minscore
var request_counter_map = d3.map([]);
/**
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 **/

exports.countsTaxonsGroupTimeValidation = function(req, res, next) {

  debug('countsTaxonsGroupTimeValidation')

  var data_request = {}
  var data_target = {}
  var str_query = ''

  var date_new = new Date()
  var day = date_new.getDate()
  var month = date_new.getMonth() + 1
  var year = date_new.getFullYear()

  var grid_resolution = verb_utils.getParam(req, 'grid_resolution', default_resolution) 
  var region = parseInt(verb_utils.getParam(req, 'region', verb_utils.region_mx))
  var fosil = verb_utils.getParam(req, 'fosil', true)

  var date  = false //verb_utils.getParam(req, 'date', true)

  var lim_inf = verb_utils.getParam(req, 'lim_inf', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup = verb_utils.getParam(req, 'lim_sup',  year+"-"+month+"-"+day)
  var lim_inf_validation = verb_utils.getParam(req, 'lim_inf_validation', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup_validation = verb_utils.getParam(req, 'lim_sup_validation',  year+"-"+month+"-"+day)

  var cells = verb_utils.getParam(req, 'excluded_cells', [])

  debug("grid_resolution: " + grid_resolution)

  data_request["excluded_cells"] = cells
  data_request["region"] = region
  data_request["grid_resolution"] = grid_resolution
  data_request["res_celda"] = "cells_"+grid_resolution+"km"
  data_request["res_celda_sp"] = "cells_"+grid_resolution+"km_"+region 
  data_request["res_celda_snib"] = "gridid_"+grid_resolution+"km" 
  data_request["res_celda_snib_tb"] = "grid_geojson_" + grid_resolution + "km_aoi"
  data_request["res_grid_tbl"] = "grid_" + data_request.grid_resolution + "km_aoi"
  data_request["min_occ"] = verb_utils.getParam(req, 'min_cells', 1)
  data_request['lim_inf_validation'] = lim_inf_validation
  data_request['lim_sup_validation'] = lim_sup_validation

  var target_group = verb_utils.getParam(req, 'target_taxons', []) 
  
  data_request["target_name"] = verb_utils.getParam(req, 'target_name', 'target_group')
  debug("*****1: " + data_request["target_name"])
  
  data_request["where_target"] = verb_utils.getWhereClauseFromGroupTaxonArray(target_group, true)
  debug("*****1: " + data_request["where_target"])

  data_request["where_exclude_target"] = verb_utils.getExcludeTargetWhereClause(target_group)
  debug("*****1: " + data_request["where_exclude_target"])


  var where_filter_target    = ''

  where_filter_target = " and (make_date(aniocolecta, mescolecta, diacolecta) between "
                + "'" + lim_inf + "' and '" + lim_sup + "'"
                + " and diacolecta <> 99 and diacolecta <> -1"
                + " and mescolecta <> 99 and mescolecta <> -1"
                + " and aniocolecta <> 9999 and aniocolecta <> -1) "

  where_filter_validation = " and (make_date(aniocolecta, mescolecta, diacolecta) between "
                + "'" + lim_inf_validation + "' and '" + lim_sup_validation + "'"
                + " and diacolecta <> 99 and diacolecta <> -1"
                + " and mescolecta <> 99 and mescolecta <> -1"
                + " and aniocolecta <> 9999 and aniocolecta <> -1) "

  if(date === true){
    where_filter_target += " or (true and b.gridid_statekm is not null)"
  }

  debug("where_filter_target: " + where_filter_target)

  data_request["where_filter_target"] = where_filter_target
  data_request["where_filter_validation"] = where_filter_validation


  var covars_groups = verb_utils.getParam(req, 'covariables', []) 
  
  data_request["alpha"] = undefined
  data_request["idtabla"] = verb_utils.getParam(req, 'idtabla', "")
  data_request["get_grid_species"] = verb_utils.getParam(req, 'get_grid_species', false)
  data_request["apriori"] = verb_utils.getParam(req, 'apriori', false)
  data_request["mapa_prob"] = verb_utils.getParam(req, 'mapa_prob', false)
  data_request["long"] = verb_utils.getParam(req, 'longitud', 0)
  data_request["lat"] = verb_utils.getParam(req, 'latitud', 0)
  data_request["title_valor"] = {'title': data_request["target_name"]}
  data_request["with_data_freq"] = verb_utils.getParam(req, 'with_data_freq', true)
  data_request["with_data_score_cell"] = verb_utils.getParam(req, 'with_data_score_cell', true)
  data_request["with_data_freq_cell"] = verb_utils.getParam(req, 'with_data_freq_cell', true)
  data_request["with_data_score_decil"] = verb_utils.getParam(req, 'with_data_score_decil', true)
  

  pool.task(t => {


    var query = queries.subaoi.getCountriesRegion

    /*
      Se obtiene filtro para target 
    */
    return t.one(query, data_request).then(resp => {

      data_request["gid"] = resp.gid
      data_request["where_filter"] = verb_utils.getWhereClauseFilter(fosil, date, lim_inf, lim_sup, cells, data_request["res_celda_snib"], data_request["region"], data_request["gid"])
      
    }).then(resp=> {

        data_request['source_cells'] = []
        data_request['total_cells'] = []

        /*
          Se obtiene el numero de celdas totales
        */
        return t.one(queries.basicAnalysis.getN, {

            grid_resolution: data_request['grid_resolution'],
            footprint_region: data_request['region']
        
        }).then(data => {


            data_request['N'] = data['n']
            data_request["alpha"] = data_request["alpha"] !== undefined ? data_request["alpha"] : 1.0/data_request['N']

            debug("N:" + data_request['N'])

            var query_analysis = queries.countsTaxonGroups.getCountsBase
            data_request['groups'] = verb_utils.getCovarGroupQueries(queries, data_request, covars_groups)

            debug('grupos covariables ' + covars_groups)

            data_request["cell_id"] = 0

            if(JSON.parse(data_request.apriori) === true || JSON.parse(data_request.mapa_prob) === true) {


              return t.one(queries.basicAnalysis.getAllGridId, data_request).then(data => {

                data_request.all_cells = data
                return t.any(query_analysis, data_request)

              })


            } else {

              debug("analisis basico")

              const query1 = pgp.as.format(query_analysis, data_request)
              debug(query1)

              /*                Se genera analisis
              */
              return t.any(query_analysis, data_request)

            }

        }).then(data => {

          var query = queries.getTimeValidation.getCellValidation

          const query1 = pgp.as.format(query, {

            where_target: data_request["where_target"].replace('WHERE', ''),
            grid_resolution: data_request["grid_resolution"],
            lim_inf_validation: data_request['lim_inf_validation'],
            lim_sup_validation: data_request['lim_sup_validation']

          })
          debug(query1)

          return t.any(query, {

            where_target: data_request["where_target"].replace('WHERE', ''),
            grid_resolution: data_request["grid_resolution"],
            lim_inf_validation: data_request['lim_inf_validation'],
            lim_sup_validation: data_request['lim_sup_validation']

          }).then(validation_data => {

              debug(validation_data)
              score_map = verb_utils.getScoreMap(data)
              time_validation = verb_utils.getTimeValidation(score_map, validation_data)

              var score_array = verb_utils.scoreMapToScoreArray(score_map)
              //debug(time_validation)

              res.json({
                ok: true,
                data: data,
                validation_data: validation_data['target_cells'],
                data_score_cell: score_array,
                time_validation: time_validation
              })

          })

        })
        
    })

  }).catch(error => {
    
    debug("ERROR EN PROMESA" + error)

    var message = '';

    if(error.received === 0 && error.query.indexOf('select array_agg(cell) as total_cells') != -1){

      message = 'No hay datos de validación espacial';

    } else {
      
      message = "Error al ejecutar la petición";

    }

    res.json({
        ok: false,
        message: message,
        data:[],
        error: error
      })
  })


}