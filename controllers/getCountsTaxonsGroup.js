/**
* @module controllers/getCountsTaxonsGroup
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
**/
var debug = require('debug')('verbs:getCountsTaxonsGroup')
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

exports.getTaxonsGroupRequestV2 = function(req, res, next) {

  debug('getTaxonsGroupRequestV2')

  var data_request = {}
  var data_target = {}
  var str_query = ''

  var date_new = new Date()
  var day = date_new.getDate()
  var month = date_new.getMonth() + 1
  var year = date_new.getFullYear()


  data_request["decil_selected"] = verb_utils.getParam(req, 'decil_selected', [10])

  // var grid_resolution = parseInt(verb_utils.getParam(req, 'grid_resolution', 16)) 
  var grid_resolution = verb_utils.getParam(req, 'grid_resolution', default_resolution) 
  var region = parseInt(verb_utils.getParam(req, 'region', default_region))
  var fosil = verb_utils.getParam(req, 'fosil', true)

  var date  = false //verb_utils.getParam(req, 'date', true)

  var lim_inf = verb_utils.getParam(req, 'lim_inf', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup = verb_utils.getParam(req, 'lim_sup',  year+"-"+month+"-"+day)

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

  var target_group = verb_utils.getParam(req, 'target_taxons', []) 
  
  data_request["target_name"] = verb_utils.getParam(req, 'target_name', 'target_group')
  // debug("*****1: " + data_request["target_name"])
  
  data_request["where_target"] = verb_utils.getWhereClauseFromGroupTaxonArray(target_group, true)
  // debug("*****1: " + data_request["where_target"])

  data_request["where_exclude_target"] = verb_utils.getExcludeTargetWhereClause(target_group)
  // debug("*****1: " + data_request["where_exclude_target"])


  var where_filter_target    = ''

  where_filter_target = " and (make_date(aniocolecta, mescolecta, diacolecta) between "
                + "'" + lim_inf + "' and '" + lim_sup + "')"
          
  if(date === true){
    where_filter_target += " or (true and b.gridid_statekm is not null)"
  }

  debug("where_filter_target: " + where_filter_target)

  data_request["where_filter_target"] = where_filter_target



  var covars_groups = verb_utils.getParam(req, 'covariables', []) 
  // debug(covars_groups)
  
  //data_request['groups'] = verb_utils.getCovarGroupQueries(queries, data_request, covars_groups)

  data_request["alpha"] = undefined
  data_request["idtabla"] = verb_utils.getParam(req, 'idtabla', "")
  //data_request["idtabla"] = 'tbl_'
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
   
  var NIterations = verb_utils.getParam(req, 'iterations', iterations)
  var iter = 0
  var json_response = {}

  pool.task(t => {

    var query = queries.subaoi.getCountriesRegion  

    return t.one(query, data_request).then(resp => {

      data_request["gid"] = resp.gid
      //debug(data_request["gid"])
      data_request["where_filter"] = verb_utils.getWhereClauseFilter(fosil, date, lim_inf, lim_sup, cells, data_request["res_celda_snib"], data_request["region"], data_request["gid"])

      // debug("filter: " + data_request["where_filter"])
      
      debug("Iteraciones: " + NIterations)

      for(var iter = 0; iter<NIterations; iter++){

        initialProcess(iter, NIterations, data_request, res, json_response, req, covars_groups)

      }

    })

  })

}


function initialProcess(iter, total_iterations, data, res, json_response, req, covars_groups) {

  debug('initialProcess')
  debug('iter:' + (iter + 1))

  var data_request = JSON.parse(JSON.stringify(data))
  
  // debug(data_request)

  pool.task(t => {

    var query = queries.getGridSpeciesNiche.getTargetCells

    const query1 = pgp.as.format(query, {

      gridid: data_request["res_celda_snib"],
      where_target: data_request["where_target"].replace('WHERE', ''),
      view: data_request["res_celda_snib_tb"],
      region: data_request["region"],
      cells: data_request["res_celda_sp"],
      grid_resolution:data_request["grid_resolution"],
      where_filter: data_request["where_filter_target"]

    });

    // debug(query1)

    return t.one(query, {

      gridid: data_request["res_celda_snib"],
      where_target: data_request["where_target"].replace('WHERE', ''),
      view: data_request["res_celda_snib_tb"],
      region: data_request["region"],
      cells: data_request["res_celda_sp"],
      grid_resolution:data_request["grid_resolution"],
      where_filter: data_request["where_filter_target"]

    }).then(resp => {

      // Celdas ocupadas por la especie objetivo dado un conjunto de parametros
      data_request["target_cells"] = resp["target_cells"]      


      var query = data_request.idtabla === "" ? "select array[]::integer[] as total_cells" : queries.validationProcess.getTotalCells
      //debug(query)

      return t.one(query, {

          tbl_process: data_request.idtabla,
          iter: (iter+1)

      }).then(resp => { 

        data_request["total_cells"] = resp.total_cells

        var query = data_request.idtabla === "" ? "select array[]::integer[] as source_cells" : queries.validationProcess.getSourceCells
        //debug(query)

        /*const query1 = pgp.as.format(query, {
        
          tbl_process: data_request.idtabla,
          iter: (iter+1),
          res_grid_tbl: data_request.res_grid_tbl,
          res_grid_column: data_request.res_celda_snib

        })
        debug(query1)*/

        return t.one(query, {
        
          tbl_process: data_request.idtabla,
          iter: (iter+1),
          res_grid_tbl: data_request.res_grid_tbl,
          res_grid_column: data_request.res_celda_snib

        }).then(resp => {

          // debug(resp.source_cells)

          data_request["source_cells"] = resp.source_cells

          return t.one(queries.basicAnalysis.getN, {

                grid_resolution: data_request.grid_resolution,
                footprint_region: data_request.region

          })

        })
      }).then(resp => {

           data_request["N"] = resp.n 
           data_request["alpha"] = data_request["alpha"] !== undefined ? data_request["alpha"] : 1.0/resp.n

           // debug("------------")
           debug("N:" + data_request["N"])
           // debug("alpha:" + data_request["alpha"])
           // debug("source_cells:" + data_request["source_cells"].length)
           // debug("total_cells:" + data_request["total_cells"].length)
           // debug("------------")

           // se genera query
           var query_analysis = queries.countsTaxonGroups.getCountsBase
           //data_request["where_filter"] = verb_utils.getWhereClauseFilter(fosil, date, lim_inf, lim_sup, cells, data_request["res_celda_snib"])
           //data_request["where_target"] = verb_utils.getWhereClauseFromGroupTaxonArray(target_group, true)
           data_request['groups'] = verb_utils.getCovarGroupQueries(queries, data_request, covars_groups)
           
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
              //debug("iter " + iter + query1)

              return t.one(queries.basicAnalysis.getGridIdByLatLong, data_temp).then(resp => {

                    data_request["cell_id"] = resp.gridid
                    data_request["cve_ent"] = resp.cve_ent
                    data_request["nom_ent"] = resp.nom_ent
                    data_request["cve_mun"] = resp.cve_mun
                    data_request["nom_mun"] = resp.nom_mun

                    debug("cell_id: " + data_request.cell_id)

                    return t.any(query_analysis, data_request)  

              })

           } 
           else {

             debug("analisis general")

             data_request["cell_id"] = 0

             //debug(JSON.parse(data_request.apriori))
             //debug(JSON.parse(data_request.mapa_prob))
             if(JSON.parse(data_request.apriori) === true || JSON.parse(data_request.mapa_prob) === true) {


              return t.one(queries.basicAnalysis.getAllGridId, data_request).then(data => {

                data_request.all_cells = data
                return t.any(query_analysis, data_request)

              })


             } else {

              debug("analisis basico")

              // debug(query_analysis)
              // debug(data_request)


              const query1 = pgp.as.format(query_analysis, data_request)
              debug("iter " + iter + query1)
              
              return t.any(query_analysis, data_request)

             }

           }


      })
      
      
    })    

  }).then(data_iteration => {

      //debug(data_iteration)

      // debug("data_iteration[0].ni: " + data_iteration[0].ni)
      // debug("data_iteration.length: " + data_iteration.length)
      // debug("target_cells.length: " +  data_request["target_cells"].length)

      // debug("source_cells.length: " +  data_request["source_cells"].length)
      // debug("total_cells.length: " +  data_request["total_cells"].length)

      //debug('ppppppppppppppp', data_request["source_cells"].length)

      var decil_selected = data_request["decil_selected"]
    
      var data_response = {iter: (iter+1), data: data_iteration, test_cells: data_request["source_cells"], target_cells: data_request["target_cells"], apriori: data_request.apriori, mapa_prob: data_request.mapa_prob }
      json_response["data_response"] = json_response["data_response"] === undefined ? [data_response] : json_response["data_response"].concat(data_response)
      
      if(!request_counter_map.has(data_request["title_valor"].title)){

        request_counter_map.set(data_request["title_valor"].title, 1)

      } else {

        var count = request_counter_map.get(data_request["title_valor"].title);
        request_counter_map.set(data_request["title_valor"].title, count+1)
      
      }    
    
      if(request_counter_map.get(data_request["title_valor"].title) === total_iterations){

        request_counter_map.set(data_request["title_valor"].title, 0)
        
        debug("COUNT PROCESS FINISHED")
        var data = []
        var data_avg = []
        var validation_data = []
        var is_validation = false
        var data_freq = []
        var info_cell = []
        

        if(total_iterations !== 1){

          debug("PROCESS RESULTS FOR VALIDATION")
          is_validation = true


          // Promedia los valores obtenidos en las N iteraciones para n, nj, nij, ni, epsilon y score. 
          // Además obtiene un array de cobertura total por las celdas de cada especie

          var dup_array = JSON.parse(JSON.stringify(json_response["data_response"]))

          data = verb_utils.processGroupValidationData(dup_array)

          // Obtiene los 20 rangos de epsilon y score por especie, utilizados para las gráficas en el cliente de frecuencia por especie. 
          // En caso de ser validación se promedia cada rango
          data_freq = data_request.with_data_freq === true ? verb_utils.processDataForFreqSpecie(json_response["data_response"], is_validation) : []

          validation_data = data_request.with_data_score_decil === true ? verb_utils.getValidationValues(json_response["data_response"]) : []
          var cell_summary = verb_utils.cellSpatialSummary(data_iteration, dup_array, total_iterations)          

        } else{

          debug("PROCESS RESULTS")
          is_validation = false

          data = data_iteration

          validation_data = data_request.with_data_score_decil === true ? verb_utils.getValidationDataNoValidation(data, 
                            data_request["target_cells"],
                            data_request["res_celda_snib"], 
                            data_request["where_target"], 
                            data_request["res_celda_snib_tb"], 
                            data_request["region"], 
                            data_request["res_celda_sp"], 
                            data_request["apriori"],
                            data_request["mapa_prob"],
                            queries) : []

          
          // Obtiene los 20 rangos de epsilon y score por especie, utilizados para las gráficas en el cliente de frecuencia por especie. 
          // En caso de ser validación se promedia cada rango
          data_freq = data_request.with_data_freq === true ? verb_utils.processDataForFreqSpecie([data], is_validation) : []
          var cell_summary = verb_utils.cellSimpleSummary(data)
          
        }

        var apriori = false
        debug("data_request.apriori: " + data_request.apriori)
        if(data_request.apriori !== false && data[0].ni !== undefined){
          apriori = true
        }

        var mapa_prob = false
        debug("data_request.mapa_prob: " + data_request.mapa_prob)
        if(data_request.mapa_prob !== false && data[0].ni !== undefined){
          mapa_prob = true          
        }


        // TODO: Revisar comportamiento con seleccion de celda
        // data = is_validation ? data_avg : data

        var cell_id = 0
        if(data_request.get_grid_species !== false){

          // debug(data)
          cell_id = data_request.cell_id
          debug("cell_id last: " + cell_id)
          data = verb_utils.processGroupDataForCellId(data, apriori, mapa_prob, cell_id)


          info_cell.push({
            cve_ent: data_request.cve_ent,
            nom_ent: data_request.nom_ent,
            cve_mun: data_request.cve_mun,
            nom_mun: data_request.nom_mun
          })


        }



        debug("COMPUTE RESULT DATA FOR HISTOGRAMS")
        

        // Obtiene la sumatoria de score por celdas contemplando si existe apriori o probabilidad
        var data_score_cell = []
        // debug(data)
        data_score_cell = data_request.with_data_score_cell === true ? verb_utils.processDataForScoreCell(data, apriori, mapa_prob, data_request.all_cells, is_validation) : []


        // TODO: Revisar funcionamiento con validacion
        var data_freq_cell = []
        data_freq_cell = data_request.with_data_freq_cell === true ? verb_utils.processDataForFreqCell(data_score_cell) : []



        // Obtiene el score por celda, asigna decil y Obtiene la lista de especies por decil seleccionado en las N iteraciones requeridas
        // data = is_validation ? verb_utils.processCellDecilPerIter(json_response["data_response"], apriori, mapa_prob, data_request.all_cells, is_validation) : data
        var percentage_occ = []
        var decil_cells = []

        if(data_request.with_data_score_decil === true ){

          debug("Calcula valores decil")

          var decilper_iter = verb_utils.processCellDecilPerIter(json_response["data_response"], apriori, mapa_prob, data_request.all_cells, is_validation, decil_selected) 
          percentage_occ = decilper_iter.result_datapercentage
          decil_cells = decilper_iter.decil_cells

          //debug(percentage_occ);

        }

        res.json({
            ok: true,
            data: data,
            data_freq: data_request.with_data_freq ? data_freq : [],
            data_score_cell: data_request.with_data_score_cell ? data_score_cell : [],
            data_freq_cell: data_request.with_data_freq_cell ? data_freq_cell : [],
            validation_data: validation_data,
            percentage_avg: percentage_occ,
            decil_cells: decil_cells,
            info_cell: info_cell,
            cell_summary: cell_summary
        })
        
      }

    }).catch(error => {
      
      debug("ERROR EN PROMESA" + error)

      var message = '';

      if(error.received === 0 && error.query.indexOf('select array_agg(cell) as total_cells') != -1){

        message = 'No hay datos de validación espacial';
        debug(message)

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