var debug = require('debug')('verbs:getEdgesNiche')
var pgp = require('pg-promise')


var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')
var pool = verb_utils.pool
var alpha = verb_utils.alpha
var N = verb_utils.N
var default_region = verb_utils.region_mx
var default_resolution = verb_utils.covid_mx

exports.getTaxonsGroupEdges = function (req, res) {

	debug("getEdgesTaxonsGroup")

	var min_occ = verb_utils.getParam(req, 'min_occ', 1)
	var grid_res = verb_utils.getParam(req, 'grid_res', default_resolution)
	var footprint_region = verb_utils.getParam(req, 'footprint_region', default_region) 
	var source = verb_utils.getParam(req, 'source', [])
	var target = verb_utils.getParam(req, 'target', [])
	var biotic_source = verb_utils.getParam(req, 'biotic_source', true)
	var biotic_target = verb_utils.getParam(req, 'biotic_target', true)

  var fosil = verb_utils.getParam(req, 'fosil', true)
  var date  = verb_utils.getParam(req, 'date', true)
  var lim_inf = verb_utils.getParam(req, 'lim_inf', 1500)
  var lim_sup = verb_utils.getParam(req, 'lim_sup', 2020)

  debug("fosil: " + fosil)
  debug("date: " + date)
  debug("grid_res: " + grid_res)
  debug("footprint_region: " + footprint_region)
  

  var where_filter_cell    = ''
  if (date){
    where_filter_cell += ' AND ( ( aniocolecta BETWEEN ' + lim_inf + ' AND ' + lim_sup + ' ) OR aniocolecta = 9999 )'
  }
  else{
    where_filter_cell += ' AND ( aniocolecta BETWEEN ' + lim_inf + ' AND ' + lim_sup + ' ) '
  }

  if(!fosil){
    where_filter_cell += " AND (ejemplarfosil != 'SI' or ejemplarfosil isnull)"
  }
  else{
    where_filter_cell += " OR ejemplarfosil = 'SI'"
  }

  debug("where_filter_cell: " + where_filter_cell)



  // Defining useful variables
	var region_cells  =  "cells_" + grid_res + "km_" + footprint_region
	var res_cells =  "cells_" + grid_res + "km"
	var res_views = "grid_geojson_" + grid_res + "km_aoi"  
	var gridid =  "gridid_" + grid_res + "km" 
	var min_ep      = 0.0
  var max_edges   = 1000
	
  	if (source.length === 0 || target.length === 0) {
  		return res.json(
  			{
  				"ok":true,
  				"message":"source or target is empty!"
  			})
  	}

  	var bio_source = []
  	var abio_source = []
  	var where_bio_source = ''
  	var where_abio_source = ''

  	source.forEach(function(item){

  		if(item['biotic']){

  			bio_source.push(item)

  		} else {

  			abio_source.push(item)
  		}

  	})

  	if(bio_source.length > 0){

  		where_bio_source = verb_utils.getWhereClauseFromGroupTaxonArray(bio_source, false).replace('WHERE', '')

  	}

	if(abio_source.length > 0){

  		where_abio_source = verb_utils.getWhereClauseFromGroupTaxonArray(abio_source, false).replace('WHERE', '')

  	}

  	pool.task(t => {

  		// Creating queries
	    var query = queries.taxonsGroupNodes.getEdgesBase
	    var source_query = verb_utils.getCommunityAnalysisQuery(queries, footprint_region, res_cells, region_cells, res_views, source, false, where_bio_source, where_abio_source, where_filter_cell, gridid, grid_res)
	    var target_query = verb_utils.getCommunityAnalysisQuery(queries, footprint_region, res_cells, region_cells, res_views, target, true, where_bio_source, where_abio_source, where_filter_cell, gridid, grid_res).slice(5)

      // debug("query: " + query)
      // debug("source_query: " + source_query)
      // debug("target_query: " + target_query)

	    //const query1 = pgp.as.format(query, {source: source_query, target: target_query, res_views: res_views, region: footprint_region, min_occ: min_occ})
      //debug(query1)

        // Executing queries
	    return t.any(query, {
	    	source: source_query,
	    	target: target_query,
	    	res_views: res_views,
	    	region: footprint_region,
	    	min_occ: min_occ

	    }).then(resp => {
    		
        debug("numero de aristas " + resp.length)

    		res.json({
    			
    			"ok":true,
    			"data":resp

    		})
	    	
	    }).catch(error => {
	    	
	    	res.json({
	    	
	    		"ok":false,
	    		"message": "error has ocurred!",
	    		"error": error

	    	})

	    })

	})

}


