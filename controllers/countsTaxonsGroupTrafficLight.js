/**
* @module controllers/countsTaxonsGroupTrafficLight
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
**/
var debug = require('debug')('verbs:countsTaxonsGroupTrafficLight')
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

exports.countsTaxonsGroupTrafficLight = function(req, res, next) {

  debug('countsTaxonsGroupTrafficLight')

  var data_request = {}
  var data_target = {}
  var str_query = ''

  var date_new = new Date()
  var day = date_new.getDate()
  var month = date_new.getMonth() + 1
  var year = date_new.getFullYear()


  data_request["decil_selected"] = verb_utils.getParam(req, 'decil_selected', [10])

  var grid_resolution = verb_utils.getParam(req, 'grid_resolution', default_resolution) 
  var region = parseInt(verb_utils.getParam(req, 'region', verb_utils.region_mx))
  var fosil = verb_utils.getParam(req, 'fosil', true)
  var memory = verb_utils.getParam(req, 'memory', false)

  var date  = false //verb_utils.getParam(req, 'date', true)

  var lim_inf = verb_utils.getParam(req, 'lim_inf', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup = verb_utils.getParam(req, 'lim_sup',  year+"-"+month+"-"+day)
  var lim_inf_validation = verb_utils.getParam(req, 'lim_inf_validation', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup_validation = verb_utils.getParam(req, 'lim_sup_validation',  year+"-"+month+"-"+day)
  var step = verb_utils.getParam(req, 'step', 1)

  var period1_presence = verb_utils.getParam(req, 'period1_presence',  )

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
  data_request['lim_inf'] = lim_inf
  data_request['lim_sup'] = lim_sup
  data_request['step'] = step

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
  data_request["long"] = verb_utils.getParam(req, 'longitud', 0)
  data_request["lat"] = verb_utils.getParam(req, 'latitud', 0)

  pool.task(t => {

    var query  = queries.getTrafficLight.getHistory

    const query1 = pgp.as.format(query, {

        where_target: data_request["where_target"],
        res_celda_snib: data_request["res_celda_snib"],
        res_celda_sp: data_request["res_celda_sp"],
        where_filter: data_request["where_filter_target"]

    })
    debug(query1)   

    return t.any(query,  {

        where_target: data_request["where_target"],
        res_celda_snib: data_request["res_celda_snib"],
        res_celda_sp: data_request["res_celda_sp"],
        where_filter: data_request["where_filter_target"]

    }).then(resp => {

      var periods = 0
      var lim_inf = new Date(data_request['lim_inf'] + 'T06:00:00.000Z')
      var lim_sup = new Date(data_request['lim_sup'] + 'T06:00:00.000Z')

      var date_it = new Date(lim_inf)
      var limits = [lim_inf]

      while(date_it < lim_sup){
        date_it.setDate(date_it.getDate() + data_request['step']);

        var copy_date = new Date(date_it)

        limits.push(copy_date)
        periods += 1
      }

      debug('Number of periods: ' + periods)
      debug(limits)

      var cells = []
      var history_cells = {}

      resp.forEach(item => {    
        if(!cells.includes(item['cell'])){
          cells.push(item['cell'])
        }
      })

      cells.forEach(cell => {
        history_cells[cell] = []

        for(var i=0; i<periods; i++){
          history_cells[cell].push(0)          
        }

      })

      resp.forEach(item => {
        var date_aux = new Date(item['t'])

        for(var i=0; i<periods; i++){


         

          if(i < periods -1 ){


            if(limits[i] <= date_aux && date_aux < limits[i+1]){

              history_cells[item['cell']][i] = 1
              break

            }

          } else {

             if(item['cell'] == '2450'){
              debug(item['cell'], item['t'], i, limits[i], limits[i+1])
            }

            if(limits[i] <= date_aux && date_aux <= limits[i+1]){

              history_cells[item['cell']][i] = 1
              break

            }

          } 

        }

      })

      debug(history_cells)

      N = cells.length
      debug('Number of cells: ' + N)

      res.json({

        data: resp

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