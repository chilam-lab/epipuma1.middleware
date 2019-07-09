var debug = require('debug')('verbs:getEdgesNiche')
var pgp = require('pg-promise')


var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')
var pool = verb_utils.pool
var alpha = verb_utils.alpha
var N = verb_utils.N

exports.getTaxonsGroupEdges = function (req, res) {

	debug("getEdgesTaxonsGroup")

	var min_occ = verb_utils.getParam(req, 'min_occ', 5)
  	var grid_res = verb_utils.getParam(req, 'grid_res', 16)
  	var footprint_region = verb_utils.getParam(req, 'region', 1) 
  	var source = verb_utils.getParam(req, 'source', [])
  	var target = verb_utils.getParam(req, 'target', [])
  	var biotic_source = verb_utils.getParam(req, 'biotic_source', true)
  	var biotic_target = verb_utils.getParam(req, 'biotic_target', true)

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
	    var source_query = verb_utils.getCommunityAnalysisQuery(queries, footprint_region, res_cells, region_cells, res_views, source, false, where_bio_source, where_abio_source)
	    var target_query = verb_utils.getCommunityAnalysisQuery(queries, footprint_region, res_cells, region_cells, res_views, target, true, where_bio_source, where_abio_source).slice(5)

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


