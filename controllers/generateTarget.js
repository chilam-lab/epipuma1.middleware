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

exports.generateTarget = function(req, res, next) {

  debug('generateTarget')

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
  var modifier = verb_utils.getParam(req, 'modifier', 'infected')
  
  var date  = false //verb_utils.getParam(req, 'date', true)

  var lim_inf = verb_utils.getParam(req, 'lim_inf', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup = verb_utils.getParam(req, 'lim_sup',  year+"-"+month+"-"+day)
  var lim_inf_validation = verb_utils.getParam(req, 'lim_inf_validation', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup_validation = verb_utils.getParam(req, 'lim_sup_validation',  year+"-"+month+"-"+day)

  var cells = verb_utils.getParam(req, 'excluded_cells', [])
  var bining = verb_utils.getParam(req, 'bining', 'percentile')
  var bining_parameter = verb_utils.getParam(req, 'bining_parameter', 10)
  var bin = verb_utils.getParam(req, 'bining_parameter', 10)

  data_request['bining'] = bining
  data_request['bining_parameter'] = bining_parameter
  data_request['bin'] = bin

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
  data_request['modifier'] = modifier
  
  var target_group = verb_utils.getParam(req, 'target_taxons', [])
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
  var Ncells = 2458;


  pool.task(t => {

    debug('MODIFIER', data_request['modifier'])
    if(data_request['modifier'] == 'infected'){
      var query  = queries.getTimeValidation.getCountCellFirst
    } else if (data_request['modifier'] == 'incidence') {
      var query  = queries.getTimeValidation.getCountCellFirstIncidence
    } else {
      var query  = queries.getTimeValidation.getCountCellFirstPrevalence
    }

    var where_validation = data_request["where_target"]

    const query1 = pgp.as.format(query, {

      where_target: where_validation.replace('WHERE', ''),
      grid_resolution: data_request["grid_resolution"],
      lim_inf: data_request['lim_inf']

    })
    debug(query1)

    return t.any(query,  {
              where_target: where_validation.replace('WHERE', ''),
              grid_resolution: data_request["grid_resolution"],
              lim_inf: data_request['lim_inf'],
              
    }).then(resp => {

      debug('FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD')

      var first = resp
      
      var first1s = 0;
      var first0s = 0;
      var first_presence = [] 
      
      first.forEach(item => {

        if(parseFloat(item['occ']) > 0) {
          first1s += 1;

          first_presence.push(item)

        } else {
          first0s += 1;
        }

      });

      debug('first presence', first_presence.length)
      debug('0s:', first0s, '1s:', first1s, 'total:', first0s + first1s)

      var bin = data_request['bin']
      var percentiles = parseInt(data_request['bining_parameter'])

      var limits = []
      var bin = data_request['bin']
      //var bin = 7
      
      if(data_request['bining'] == 'percentile') {

        for(var i=0; i<=percentiles; i++) {

          var val = parseInt(Ncells*i/percentiles) - parseInt(i/percentiles)
          //limits.push(parseInt(training[val]['occ']))
          limits.push(val)

        }

        debug(limits)

        var first_cells = []
        if(first1s >= parseInt(Ncells / percentiles)){

          for(var i=0; i<Ncells; i++){

            if(limits[bin-1] <= i && i <= limits[bin]) {

              first_cells.push(first[i]['gridid'])

            }

          }

        } else {

          first.forEach(item => {

            if(parseFloat(item['occ']) > 0) {
              first_cells.push(item['gridid']);
            } 

          });

        }
          

      } else {



      }

      debug('celdas en decil 10 del primer periodo', first_cells.length)
      first_presence = first_presence.sort(function(a, b) {return  parseFloat(b['occ']) - parseFloat(a['occ']);})
      debug('celdas con presencia ', first_presence)
      data_request['first_cells'] = first_cells 
      data_request['first_occur'] = first_presence

      //debug(data_request['first_cells'].length, data_request['first_cells'])
      debug('FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD FIRST PERIOD')

      debug('MODIFIER', data_request['modifier'])
      if(data_request['modifier'] == 'infected'){
        var query = queries.getTimeValidation.getCountCellTrainingTop
      } else if (data_request['modifier'] == 'incidence') {
        var query  = queries.getTimeValidation.getCountCellTrainingIncidence
      } else {
        var query  = queries.getTimeValidation.getCountCellTrainingPrevalence
      }

      var where_validation = data_request["where_target"]

      const query1 = pgp.as.format(query, {

        where_target: where_validation.replace('WHERE', ''),
        grid_resolution: data_request["grid_resolution"],
        lim_inf: data_request['lim_inf'],
        lim_sup: data_request['lim_sup'],
        first_cells: data_request['first_cells'].length ==  0 ? '' : data_request['first_cells'] 

      })
      debug(query1)

      return t.any(query,  {
                where_target: where_validation.replace('WHERE', ''),
                grid_resolution: data_request["grid_resolution"],
                lim_inf: data_request['lim_inf'],
                lim_sup: data_request['lim_sup'],
                first_cells: data_request['first_cells'].length ==  0 ? '' : data_request['first_cells']

      }).then(resp => {

        debug('TRAINING PERIOD TRAINING PERIOD  TRAINING PERIOD  TRAINING PERIOD  TRAINING PERIOD  TRAINING PERIOD  TRAINING PERIOD ')
        var training = resp
        var training_data = []

        var train1s = 0;
        var train0s = 0;
        var training_presence = []
        
        training.forEach(item => {

          if(!data_request['first_cells'].includes(item['gridid'])){
            training_data.push(item)
          }

          if(parseFloat(item['occ']) > 0){
            training_presence.push(item)
          }

        });

        training_data.forEach(item => {

          if(parseFloat(item['occ']) > 0) {
            train1s += 1;
          } else {
            train0s += 1;
          }

        });

        debug('training presence', training_presence.length)
        debug('0s:', train0s, '1s:', train1s, 'total:', train0s + train1s)

        Ncells = train0s + train1s

        var limits = []
        var bin = data_request['bin']
        var percentiles = parseInt(data_request['bining_parameter'])
        var width_top = parseInt(2458/percentiles)

        if(data_request['bining'] == 'percentile') {
          
          var Ncells1 = Ncells - width_top - 1

          for(var i=0; i<percentiles-1; i++) {

            var val = parseInt(Ncells1*i/percentiles) - parseInt(i/percentiles)
            //limits.push(parseInt(training[val]['occ']))
            limits.push(val)

          }

          limits.push(Ncells1)
          limits.push(Ncells - 1)

          debug(limits)

          var training_cells = []
          if (train1s >= parseInt(Ncells / percentiles)) {

            for(var i=0; i<Ncells; i++){

              if(limits[bin-1] <= i && i <= limits[bin]) {

                //debug(training_data[i])
                training_cells.push(training_data[i]['gridid'])

              }
            }

          } else {

            training_data.forEach(item => {

              if(parseFloat(item['occ']) > 0) {
                training_cells.push(item['gridid']);
              } 

            });

          }

        } else {

        }

        debug('celdas en decil 10 del periodo de entrenamiento', training_cells.length)
        data_request['training_cells'] = training_cells
        training_presence = training_presence.sort(function(a, b) {return  parseFloat(b['occ']) - parseFloat(a['occ']);})
        debug('celdas con presencia ', training_presence)
        data_request['training_occur'] = training_presence

        //debug(data_request['training_cells'].length, data_request['training_cells'])
        debug('TRAINING PERIOD TRAINING PERIOD  TRAINING PERIOD  TRAINING PERIOD  TRAINING PERIOD  TRAINING PERIOD  TRAINING PERIOD ')
        
        var query = queries.subaoi.getCountriesRegion

        /*
          Se obtiene filtro para target 
        */
        return t.one(query, data_request).then(resp => {

          data_request["gid"] = resp.gid
          data_request["where_filter"] = verb_utils.getWhereClauseFilter(fosil, date, lim_inf, lim_sup, cells, data_request["res_celda_snib"], data_request["region"], data_request["gid"])
          if(!memory){
            data_request["where_filter"] += ' AND gridid_' + grid_resolution + 'km = ANY(ARRAY[' + training_cells.toString() + ']::text[])'
          }
          //debug(data_request["where_filter"])
          data_request["training"] = 'ARRAY[' + training_cells.toString() + ']::integer[]'
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

                 // var query_analysis = queries.countsTaxonGroups.getCountsBase
                  var query_analysis = queries.getTimeValidation.getCountsBaseCount
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

                      debug('--------------------------------------------------')

                      debug("analisis en celda")

                      debug("long: " + data_request.long)
                      debug("lat: " + data_request.lat)

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

                      debug("analisis basico")

                      const query1 = pgp.as.format(query_analysis, data_request)
                      debug(query1)

                      /*                Se genera analisis
                      */
                      return t.any(query_analysis, data_request)


                    }
                  }

            })

          })

        })

    }).then(data => {

      var training_cells = data_request['training_cells']
      var first_cells = data_request['first_cells'] 

       debug(data.length)
       //debug(data)

       debug('MODIFIER', data_request['modifier'])
       if(data_request['modifier'] == 'infected'){
          var query = queries.getTimeValidation.getCountCellValidationTop
       } else if (data_request['modifier'] == 'incidence') {
          var query  = queries.getTimeValidation.getCountCellValidationIncidence
       } else {
          var query  = queries.getTimeValidation.getCountCellValidationPrevalence
       }
        var where_validation = data_request["where_target"]

        if(validation_group.length > 0){
          where_validation = data_request["where_validation"]      
        }

        const query1 = pgp.as.format(query, {

          where_target: where_validation.replace('WHERE', ''),
          grid_resolution: data_request["grid_resolution"],
          lim_inf: data_request['lim_inf'],
          lim_sup: data_request['lim_sup'],
          lim_inf_validation: data_request['lim_inf_validation'],
          lim_sup_validation: data_request['lim_sup_validation'],
          first_cells : data_request['first_cells'].length ==  0 ? '' : data_request['first_cells'],
          training_cells : data_request['training_cells'].length == 0 ? '' : data_request['training_cells']

        })
        debug(query1)

        return t.any(query, {

          where_target: where_validation.replace('WHERE', ''),
          grid_resolution: data_request["grid_resolution"],
          lim_inf: data_request['lim_inf'],
          lim_sup: data_request['lim_sup'],
          lim_inf_validation: data_request['lim_inf_validation'],
          lim_sup_validation: data_request['lim_sup_validation'],
          first_cells : data_request['first_cells'].length ==  0 ? '' : data_request['first_cells'],
          training_cells : data_request['training_cells'].length == 0 ? '' : data_request['training_cells']

        }).then(validation_data => {


            debug('VALIDATION PERIOD VALIDATION PERIOD  VALIDATION PERIOD  VALIDATION PERIOD  VALIDATION PERIOD  VALIDATION PERIOD ')

            var validation = validation_data
            var validation_data = []

            var val1s = 0;
            var val0s = 0;
            var validation_presence = []
            
            validation.forEach(item => {

              if(!data_request['first_cells'].includes(item['gridid']) 
                && !data_request['training_cells'].includes(item['gridid'])){

                validation_data.push(item)
              }

              if(parseFloat(item['occ']) > 0){
                validation_presence.push(item)
              }

            });

            validation_data.forEach(item => {

              if(parseFloat(item['occ']) > 0) {
                val1s += 1;
              } else {
                val0s += 1;
              }

            });

            debug('validation presence', validation_presence.length)
            debug('0s:', val0s, '1s:', val1s, 'total:', val0s + val1s)

            Ncells = val0s + val1s

            //debug('validation cells')
            //debug(validation)
            var limits = []
            var bin = data_request['bin']
            var percentiles = parseInt(data_request['bining_parameter'])
            var width_top = parseInt(2458/percentiles)

            if(data_request['bining'] == 'percentile') {

              var Ncells1 = Ncells - width_top - 1

              for(var i=0; i<percentiles-1; i++) {

                var val = parseInt(Ncells*i/percentiles) - parseInt(i/percentiles)
                //limits.push(parseInt(training[val]['occ']))
                limits.push(val)

              }

              limits.push(Ncells1)
              limits.push(Ncells - 1)

              debug(limits)

              var validation_cells = []

              if(val1s >= parseInt(Ncells/percentiles)){

                for(var i=0; i<Ncells; i++){

                  if(limits[bin-1] <= i && i <= limits[bin]) {

                    //debug(validation[i])
                    validation_cells.push(validation_data[i]['gridid'])

                  }
                }

              } else {

                validation_data.forEach(item => {

                  if(parseFloat(item['occ']) > 0) {
                    validation_cells.push(item['gridid']);
                  } 

                });                

              }

            } else {



            }


            debug('celdas en decil 10 del periodo de validación ', validation_cells.length)
            data_request['validation_cells'] = validation_cells

            validation_presence = validation_presence.sort(function(a, b) {return  parseFloat(b['occ']) - parseFloat(a['occ']);})
            debug('celdas con presencia ', validation_presence)
            data_request['validation_occur'] = validation_presence

            debug('VALIDATION PERIOD VALIDATION PERIOD  VALIDATION PERIOD  VALIDATION PERIOD  VALIDATION PERIOD  VALIDATION PERIOD ')

            score_map = verb_utils.getScoreMap(data)
            time_validation = verb_utils.getCountTimeValidation(score_map, training_cells, validation_cells)
            var percentage_occ = []
            var decil_cells = []
            var info_cell = []

            var score_array = verb_utils.scoreMapToScoreArray(score_map)
            //debug(time_validation)

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

            debug('length first_cells     :', data_request['first_cells'].length)
            debug('length training_cells  :', data_request['training_cells'].length)
            debug('length validation_cells:', data_request['validation_cells'].length)

            var first_presence = data_request['first_occur']
            var training_presence = data_request['training_occur']
            var validation_presence = data_request['validation_occur']

            var cell_summary = verb_utils.cellCountSummary(data, first_cells, training_cells, 
                                                  first_presence, validation_cells, training_presence, validation_presence)


            
            
            info_cell.push({
              cve_ent: data_request.cve_ent,
              nom_ent: data_request.nom_ent,
              cve_mun: data_request.cve_mun,
              nom_mun: data_request.nom_mun
            })

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
              validation_data: validation_data,
              info_cell: info_cell
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