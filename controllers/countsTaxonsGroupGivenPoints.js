var debug = require('debug')('verbs:countsTaxonsGroupGivenPoints')
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
var max_score = verb_utils.maxscore
var min_score = verb_utils.minscore
var request_counter_map = d3.map([]);

exports.countsTaxonsGroupGivenPoints = function(req, res, next) {

  debug('countsTaxonsGroupGivenPoints')

  var data_request = {}
  var data_target = {}
  var str_query = ''


  data_request["decil_selected"] = verb_utils.getParam(req, 'decil_selected', [10])

  var grid_resolution = parseInt(verb_utils.getParam(req, 'grid_resolution', 16)) 
  var region = parseInt(verb_utils.getParam(req, 'region', verb_utils.region_mx))
  var fosil = verb_utils.getParam(req, 'fosil', true)
  var date  = verb_utils.getParam(req, 'date', true)
  var lim_inf = verb_utils.getParam(req, 'lim_inf', 1500)
  var lim_sup = verb_utils.getParam(req, 'lim_sup', 2020)
  var cells = verb_utils.getParam(req, 'excluded_cells', [])

  data_request['lim_inf'] = lim_inf
  data_request['lim_sup'] = lim_sup
  data_request["excluded_cells"] = cells
  data_request["fosil"] = fosil
  data_request["date"] = date
  data_request["region"] = region
  data_request["grid_resolution"] = grid_resolution
  data_request["res_celda"] = "cells_"+grid_resolution+"km"
  data_request["res_celda_sp"] = "cells_"+grid_resolution+"km_"+region 
  data_request["res_celda_snib"] = "gridid_"+grid_resolution+"km" 
  data_request["res_celda_snib_tb"] = "grid_geojson_" + grid_resolution + "km_aoi"
  data_request["res_grid_tbl"] = "grid_" + data_request.grid_resolution + "km_aoi"
  data_request["min_occ"] = verb_utils.getParam(req, 'min_cells', 1)

  data_request["target_name"] = verb_utils.getParam(req, 'target_name', 'target_group')
  
  var covars_groups = verb_utils.getParam(req, 'covariables', []) 
  debug(covars_groups)
  
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
  data_request["target_points"] = verb_utils.getParam(req, 'target_points', [])

  //debug(data_request["target_points"])

  var NIterations = verb_utils.getParam(req, 'iterations', iterations)
  var iter = 0
  var json_response = {}

  pool.task(t => {

    var query = queries.subaoi.getCountriesRegion  

    return t.one(query, data_request).then(resp => {

      data_request["gid"] = resp.gid
      
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
  debug('resolution: ' + data_request["grid_resolution"])

  var points = '['
  var number_occ = 0

  data_request["target_points"].forEach(function(occ) {
  	
  	if(data_request["fosil"]){

	  	if(data_request["date"]){

        if((occ['anio'] >= data_request['lim_inf'] && occ['anio'] <= data_request['lim_sup']) || occ['anio'] == 9999){
          
          if(number_occ > 0) {
            points += ', '
          }  

          points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
          number_occ += 1

        }
  			

  		} else { 

  		  	if(occ['anio'] >= data_request['lim_inf'] && occ['anio'] <= data_request['lim_sup']){

  		  		if(number_occ > 0) {
  			  		points += ', '
  			  	} 

  		  		points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
  		  		number_occ += 1
  		  	
  		  	}

		}

	} else {

	  	if(!occ['fosil']){

	  		if(data_request["date"]){

  				if((occ['anio'] >= data_request['lim_inf'] && occ['anio'] <= data_request['lim_sup']) || occ['anio'] !== 9999){
          
            if(number_occ > 0) {
              points += ', '
            }  

            points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
            number_occ += 1

          }

  			} else {

  			  	if(occ['anio'] >= data_request['lim_inf'] && occ['anio'] <= data_request['lim_sup']){

  			  		if(number_occ > 0) {
  				  		points += ', '
  				  	}  

  			  		points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
  			  		number_occ += 1
  			  	
  			  	}

			 }

	  	}  

	}

  });

  points += ']'
  
  pool.task(t => {

    var query = queries.countsTaxonGroups.getCellSincePoint

    const query1 = pgp.as.format(query, {

    	res: data_request["grid_resolution"],
    	points: points

    })
    //debug(query1)

    return t.any(query, {

    	res: data_request["grid_resolution"],
    	points: points

    }).then(data => {

      var resp = {target_cells:[]}

      data.forEach(item => {
        resp['target_cells'].push(item['gridid'])
      });

      //debug(resp['target_cells'].length) Numero de puntos dado por el usuario

      const unique_set = new Set(resp["target_cells"])

      data_request["target_cells"] = Array.from(unique_set)

      debug(data_request["target_cells"].length)      

      /* AQUI SE HACE LA VALIDACION TAMBIEN FALTA CORREGIR FILTROS DE TARGET */

      data_request["total_cells"] = []
      data_request["source_cells"] = []



      return t.one(queries.basicAnalysis.getN, {

            grid_resolution: data_request.grid_resolution,
            footprint_region: data_request.region

      }).then(resp => {

        data_request["N"] = resp.n 
        data_request["alpha"] = data_request["alpha"] !== undefined ? data_request["alpha"] : 1.0/resp.n

        var query_analysis = queries.countsTaxonGroups.getCountsBaseGivenPoints
        data_request['groups'] = verb_utils.getCovarGroupQueries(queries, data_request, covars_groups)

        if( data_request["get_grid_species"] !== false ) {

          debug("analisis en celda")

          debug("long: " + data_request.long)
          debug("lat: " + data_request.lat)

          data_temp = {
            'res_celda_snib'    : data_request.res_celda_snib, 
            'res_celda_snib_tb' : data_request.res_grid_tbl,
            'long'              : data_request.long,
            'lat'               : data_request.lat
          }

          const query1 = pgp.as.format(queries.basicAnalysis.getGridIdByLatLong, data_temp)
          debug("iter " + iter + query1)

          return t.one(queries.basicAnalysis.getGridIdByLatLong, data_temp).then(resp => {

                data_request["cell_id"] = resp.gridid
                debug("cell_id: " + data_request.cell_id)
                
                return t.any(query_analysis, data_request)  

          })

        } else {

          debug("analisis general")

          data_request["cell_id"] = 0

          if(JSON.parse(data_request.apriori) === true || JSON.parse(data_request.mapa_prob) === true) {


            return t.one(queries.basicAnalysis.getAllGridId, data_request).then(data => {

              data_request.all_cells = data
              return t.any(query_analysis, data_request)

            })


          } else {

            debug("analisis basico")

            //const query1 = pgp.as.format(query_analysis, data_request)
            //debug(query1)

            return t.any(query_analysis, data_request)

           }

         }

      })
    
    }).then(data_iteration => {

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

          cell_id = data_request.cell_id
          debug("cell_id last: " + cell_id)
          data = verb_utils.processGroupDataForCellId(data, apriori, mapa_prob, cell_id)
        }



        debug("COMPUTE RESULT DATA FOR HISTOGRAMS")
        

        // Obtiene la sumatoria de score por celdas contemplando si existe apriori o probabilidad
        var data_score_cell = []
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

        }


        res.json({
            ok: true,
            data: data,
            data_freq: data_freq,
            data_score_cell: data_score_cell,
            data_freq_cell: data_freq_cell,
            validation_data: validation_data,
            percentage_avg: percentage_occ,
            decil_cells: decil_cells
        })
        
      }

    }).catch(error => {

    	debug("ERROR EN PROMESA" + error)

      res.json({
          ok: false,
          message: "Error al ejecutar la petición",
          data:[],
          error: error
        })

    });
  
  });
}