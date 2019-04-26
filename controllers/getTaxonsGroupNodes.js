var debug = require('debug')('verbs:getNodesNiche')
var pgp = require('pg-promise')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 
var N = verb_utils.N 
var alpha = verb_utils.alpha
var default_region = verb_utils.region_mx

exports.getTaxonsGroupNodes = function(req, res) {

	debug("getTaxonsGroupNodes")

	// Getting parameters
	var min_occ = verb_utils.getParam(req, 'min_occ', 1)
  	var grid_res = verb_utils.getParam(req, 'grid_res', 16)
  	var footprint_region = verb_utils.getParam(req, 'region', 1) 
  	var source = verb_utils.getParam(req, 'source', [])
  	var target = verb_utils.getParam(req, 'target', [])
  	var biotic_source = verb_utils.getParam(req, 'biotic_source', true)
  	var biotic_target = verb_utils.getParam(req, 'biotic_target', true)

  	// Defining useful variables
	var region_cells  =  "cells_" + grid_res + "km_" + footprint_region   
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

  	pool.task(t => {

	    var query = queries.taxonsGroupNodes.getNodesBase
	    var source_query = verb_utils.getCommunityAnalysisQuery(queries, region_cells, source, biotic_source, false)
	    var target_query = verb_utils.getCommunityAnalysisQuery(queries, region_cells, target, biotic_target, true).slice(5)

	    //const query1 = pgp.as.format(query, {source: source_query, target: target_query})
        //debug(query1)

	    return t.any(query, {

	    	source: source_query,
	    	target: target_query

	    }).then(resp => {
    		
    		res.json({
    			
    			"ok":true,
    			"data":resp

    		})
	    	
	    }).catch(error => {
	    	
	    	res.json({
	    	
	    		"ok":false,
	    		"error": error

	    	})

	    })

  	})

}