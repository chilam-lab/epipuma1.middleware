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

			if(number_occ > 0) {
		  		points += ', '
		  	}  

		  	points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
		  	number_occ += 1

		} else { 

		  	if(occ['anio'] != 9999){

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

				if(number_occ > 0) {
			  		points += ', '
			  	}  

			  	points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
			  	number_occ += 1

			} else {

			  	if(occ['anio'] != 9999){

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

    	
    
    }).catch(error => {

    	debug(error)

    });
  
  });

  res.json({})
}