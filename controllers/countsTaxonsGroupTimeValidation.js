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


  data_request["decil_selected"] = verb_utils.getParam(req, 'decil_selected', [10])

  var grid_resolution = verb_utils.getParam(req, 'grid_resolution', default_resolution) 
  var region = parseInt(verb_utils.getParam(req, 'region', verb_utils.region_mx))
  var fosil = verb_utils.getParam(req, 'fosil', true)
  var memory = verb_utils.getParam(req, 'memory', false)
  
  var date  = false //verb_utils.getParam(req, 'date', true)

  var lim_inf_first = verb_utils.getParam(req, 'lim_inf_first', verb_utils.formatDate(new Date("1499-01-01")) );
  var lim_inf = verb_utils.getParam(req, 'lim_inf', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup_first = verb_utils.getParam(req, 'lim_sup_first', lim_inf);
  var lim_sup = verb_utils.getParam(req, 'lim_sup',  year+"-"+month+"-"+day)
  var lim_inf_validation = verb_utils.getParam(req, 'lim_inf_validation', lim_sup )
  var lim_sup_validation = verb_utils.getParam(req, 'lim_sup_validation',  year+"-"+month+"-"+day)
  var period_config = ['*', '*', '1']
  var traffic_light = verb_utils.getParam(req, 'traffic_light', 'red')

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
  data_request['lim_inf_first'] = lim_inf_first
  data_request['lim_sup_first'] = lim_sup_first
  data_request['period_config'] = period_config
  data_request['traffic_light'] = traffic_light

  var target_group = verb_utils.getParam(req, 'target_taxons', [])
  data_request['target_group'] = target_group
  var validation_group = verb_utils.getParam(req, 'validation_taxons', [])

  debug(validation_group) 
  
  data_request["target_name"] = verb_utils.getParam(req, 'target_name', 'target_group')
  debug("*****1: " + data_request["target_name"])
  
  data_request["where_target"] = verb_utils.getWhereClauseFromGroupTaxonArray(target_group, true)
  debug("*****1: " + data_request["where_target"])

  data_request["where_validation"] = verb_utils.getWhereClauseFromGroupTaxonArray(validation_group, true)
  debug("*****1: " + data_request["where_validation"])

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
  
  debug('First      Period: ', data_request['lim_inf_first'], ' to ', data_request['lim_sup_first'])
  debug('Training   Period: ', data_request['lim_inf'], ' to ', data_request['lim_sup'])
  debug('Validation Period: ', data_request['lim_inf_validation'], ' to ', data_request['lim_sup_validation'])

  pool.task(t => {

    var query = queries.getGridSpeciesNiche.getCOVID19Cases

    return t.any(query, {

    lim_inf: data_request['lim_inf'],
    lim_sup: data_request['lim_sup'],
    class: data_request['target_group'][0]['value']

    }).then(cases_by_mun => {

      data_request['cases'] = cases_by_mun

      var query  = queries.getTimeValidation.getCellFirst
      var where_validation = data_request["where_target"]

      const query1 = pgp.as.format(query, {

        where_target: where_validation.replace('WHERE', ''),
        grid_resolution: data_request["grid_resolution"],
        lim_inf_first: data_request['lim_inf_first'],
        lim_sup_first: data_request['lim_sup_first'],

      })

      debug('=======================> First Period Query <=======================')
      debug(query1)
      debug('=======================> First Period Query <=======================')

      return t.one(query,  {

        where_target: where_validation.replace('WHERE', ''),
        grid_resolution: data_request["grid_resolution"],
        lim_inf_first: data_request['lim_inf_first'],
        lim_sup_first: data_request['lim_sup_first']

      }).then(resp => {

        debug('=======================> Cells With Cases in First Period  <=======================')
        debug(resp['first_cells'].length)
        debug('=======================> Cells With Cases in First Period  <=======================')

        var first_cells = resp['first_cells']

        var query  = queries.getTimeValidation.getCellTraining
        var where_validation = data_request["where_target"]

        const query1 = pgp.as.format(query, {

          where_target: where_validation.replace('WHERE', ''),
          grid_resolution: data_request["grid_resolution"],
          lim_inf: data_request['lim_inf'],
          lim_sup: data_request['lim_sup']
        })

        debug('=======================> Training Period Query <=======================')
        debug(query1)
        debug('=======================> Training Period Query <=======================')

        return t.one(query,  {

            where_target: where_validation.replace('WHERE', ''),
            grid_resolution: data_request["grid_resolution"],
            lim_inf: data_request['lim_inf'],
            lim_sup: data_request['lim_sup']

        }).then(resp => {

          debug('=======================> Cells With Cases in Training Period  <=======================')
          debug(resp['training_cells'].length)
          debug('=======================> Cells With Cases in Training Period  <=======================')

          var training_occur = resp['training_cells']
          var training_cells = resp['training_cells']
          var training_cells_aux = []

          var m11 = 0
          var m01 = 0
          var m10 = 0
          var m00 = 0

          for(var i = 1; i <= 2458; i++){

            if(first_cells.includes(i) && training_cells.includes(i)){
              m11 += 1 
            }

            if(!first_cells.includes(i) && training_cells.includes(i)){
              m01 += 1 
            }

            if(first_cells.includes(i) && !training_cells.includes(i)){
              m10 += 1 
            }

            if(!first_cells.includes(i) && !training_cells.includes(i)){
              m00 += 1 
            }

          }

          debug('=======================> Matrix 1s and 0s <=======================')
          debug(m00, m01)
          debug(m10, m11)
          debug('=======================> Matrix 1s and 0s <=======================')

          if(data_request['traffic_light'] == 'green'){

            debug('================> TRAINING PERIOD- BEGIN: Traffic Light GREEN <===================')
            
            for(var i = 1; i <= 2458; i++){

              if(first_cells.includes(i) && !training_cells.includes(i)){
                training_cells_aux.push(i)
              }

            }

            training_cells = training_cells_aux

            debug(training_cells.length + ' cells ')
            debug('================> TRAINING PERIOD- END:   Traffic Light GREEN <===================')

          } else if(data_request['traffic_light'] == 'red'){

            debug('================> TRAINING PERIOD- BEGIN: Traffic Light RED <===================')

            for(var i = 1; i <= 2458; i++){

              if(!first_cells.includes(i) && training_cells.includes(i)){
                training_cells_aux.push(i)
              }

            }

            training_cells = training_cells_aux

            debug(training_cells.length + ' cells ')

            debug('================> TRAINING PERIOD- BEGIN: Traffic Light RED <===================')

          }
          
          var query = queries.subaoi.getCountriesRegion

          /*
            Se obtiene filtro para target 
          */
          return t.one(query, data_request).then(resp => {

            data_request["gid"] = resp.gid
            data_request["where_filter"] = verb_utils.getWhereClauseFilter(fosil, date, lim_inf, lim_sup, cells, data_request["res_celda_snib"], data_request["region"], data_request["gid"])
            
            
            if(data_request['traffic_light'] == 'green'){

              data_request["green_cells"] = 'ARRAY[' + training_cells.toString() + ']::integer[]'

            } else if(data_request['traffic_light'] == 'red'){
              
              data_request["where_filter"] += ' AND gridid_' + grid_resolution + 'km = ANY(ARRAY[' + training_cells.toString() + ']::text[])'

            }
            
            //debug(data_request["where_filter"])

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
                  debug(data_request['target_group'])

                  if(data_request['traffic_light'] == 'green'){

                    var query_analysis = queries.countsTaxonGroups.getCountsBaseGreen

                  }else if(data_request['target_group'][0]['value'] === 'COVID-19 CONFIRMADO'){

                    var query_analysis = queries.countsTaxonGroups.getCountsBaseOdds

                  } else{

                    var query_analysis = queries.countsTaxonGroups.getCountsBase
                  
                  }

                  data_request['groups'] = verb_utils.getCovarGroupQueries(queries, data_request, covars_groups)

                  debug('grupos covariables ' + covars_groups)

                  data_request["cell_id"] = 0

                  if(JSON.parse(data_request.apriori) === true || JSON.parse(data_request.mapa_prob) === true) {


                    return t.one(queries.basicAnalysis.getAllGridId, data_request).then(data => {

                      data_request.all_cells = data
                      return t.any(query_analysis, data_request)

                    })


                  } else {


                    if( data_request["get_grid_species"] !== false ) {

                      /*debug('--------------------------------------------------')

                      debug("analisis en celda")

                      debug("long: " + data_request.long)
                      debug("lat: " + data_request.lat)*/

                      var extra_columns = ""
                      if(data_request.grid_resolution == "mun"){
                        extra_columns = ', "CVE_MUN" as cve_mun, "NOM_MUN" as nom_mun '
                      }

                      data_temp = {
                        'res_celda_snib'    : data_request.res_celda_snib, 
                        'res_celda_snib_tb' : data_request.res_grid_tbl,
                        'long'              : data_request.long,
                        'lat'               : data_request.lat,
                        'extra_columns' : extra_columns
                      }

                      //const query1 = pgp.as.format(queries.basicAnalysis.getGridIdByLatLong, data_temp)
                      //debug(query1)

                      return t.one(queries.basicAnalysis.getGridIdByLatLong, data_temp).then(resp => {

                            data_request["cell_id"] = resp.gridid
                            debug("cell_id: " + data_request.cell_id)

                            // valores de la celda seleccionada
                            data_request["cell_id"] = resp.gridid
                            data_request["cve_ent"] = resp.cve_ent
                            data_request["nom_ent"] = resp.nom_ent
                            data_request["cve_mun"] = resp.cve_mun
                            data_request["nom_mun"] = resp.nom_mun
                            
                            return t.any(query_analysis, data_request).then(covars => {


                              var new_covars = []

                              var score = 0;
                              covars.forEach(covar => {

                                if(covar['cells'].includes(parseInt(data_request["cell_id"])) ) {

                                  score += parseFloat(covar.score);
                                  new_covars.push(covar)
                              
                                }

                              })

                              debug(score)
                              return new_covars;


                            })  

                      })

                    } else {

                      const query1 = pgp.as.format(query_analysis, data_request)
                      
                      debug('=======================> Analysis Query <=======================')
                      debug(query1)
                      debug('=======================> Analysis Query <=======================')

                      /*                Se genera analisis
                      */
                      return t.any(query_analysis, data_request)


                    }
                  }

            })  

      }).then(data => {

              var query = queries.getTimeValidation.getCellTraining
              var where_validation = data_request["where_target"]

              if(validation_group.length > 0){
                where_validation = data_request["where_validation"]      
              }

              const query1 = pgp.as.format(query, {

                where_target: where_validation.replace('WHERE', ''),
                grid_resolution: data_request["grid_resolution"],
                lim_inf: data_request['lim_inf_validation'],
                lim_sup: data_request['lim_sup_validation']

              })
              debug('=======================> Validation Period Query <=======================')
              debug(query1)
              debug('=======================> Validation Period Query <=======================')

              return t.one(query, {

                where_target: where_validation.replace('WHERE', ''),
                grid_resolution: data_request["grid_resolution"],
                lim_inf: data_request['lim_inf_validation'],
                lim_sup: data_request['lim_sup_validation']

              }).then(validation_data => {

                  var validation_cells = validation_data['training_cells']
                  var validation_cells_aux = []

                  debug('=======================> Cells With Cases in Validation Period  <=======================')
                  debug(validation_cells.length)
                  debug('=======================> Cells With Cases in Validation Period  <=======================')
                  
                  if(data_request['traffic_light'] == 'green'){
                    debug('================> VALIDATION PERIOD- BEGIN: Traffic Light GREEN <===================')
                     for(var i = 1; i <= 2458; i++){
                      if(training_occur.includes(i) && !validation_cells.includes(i)){
                        validation_cells_aux.push(i)   
                      }
                    }
                    validation_cells = validation_cells_aux
                    debug(validation_cells.length)
                    debug('================> VALIDATION PERIOD- END:   Traffic Light GREEN <===================')
                  } else if(data_request['traffic_light'] == 'red'){
                    debug('================> VALIDATION PERIOD- BEGIN: Traffic Light RED <===================')
                     for(var i = 1; i <= 2458; i++){
                      if(!training_occur.includes(i) && validation_cells.includes(i)){
                        validation_cells_aux.push(i)   
                      }
                    }
                    validation_cells = validation_cells_aux
                    debug(validation_cells.length)
                    debug('================> VALIDATION PERIOD- END:   Traffic Light RED <===================')
                  } 

                  var score_map = verb_utils.getScoreMap(data)
                  var time_validation = verb_utils.getTimeValidation(score_map, training_cells, validation_cells)
                  var percentage_occ = []
                  var decil_cells = []
                  var info_cell = []

                  var score_array = verb_utils.scoreMapToScoreArray(score_map)

                  var data_freq = verb_utils.processDataForFreqSpecie([data], false)

                  if(data_request.with_data_score_decil === true ){

                    debug("Calcula valores decil")

                    var data_response = {iter: 1, data: data, test_cells: data_request["source_cells"], target_cells: data_request["target_cells"], apriori: data_request.apriori, mapa_prob: data_request.mapa_prob }

                    var decilper_iter = verb_utils.processCellDecilPerIter([data_response], JSON.parse(data_request.apriori), JSON.parse(data_request.mapa_prob), data_request.all_cells, true, data_request['decil_selected']) 
                    percentage_occ = decilper_iter.result_datapercentage
                    decil_cells = decilper_iter.decil_cells

                  }

                  var data_freq_cell = []
                  data_freq_cell = verb_utils.processDataForFreqCell(score_array)

                  

                  var cell_summary = verb_utils.cellSummary(data, first_cells, training_cells, validation_cells, data_request['cases'])


                  
                  
                  info_cell.push({
                    cve_ent: data_request.cve_ent,
                    nom_ent: data_request.nom_ent,
                    cve_mun: data_request.cve_mun,
                    nom_mun: data_request.nom_mun
                  })

                  debug('TIME VALIDATION:  ')
                  debug(time_validation)

                  res.json({
                    ok: true,
                    data: data,
                    data_score_cell: data_request.with_data_score_cell ? score_array : [],
                    data_freq_cell: data_request.with_data_freq_cell ? data_freq_cell : [],
                    data_freq: data_request.with_data_freq ? data_freq : [],
                    percentage_avg: percentage_occ,
                    decil_cells: decil_cells,
                    cell_summary: cell_summary,
                    time_validation: time_validation,
                    training_cells: training_cells,
                    validation_data: validation_cells,
                    info_cell: info_cell
                  })

                  debug('TIME VALIDATION:  ')

              })

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