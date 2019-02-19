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
var pgp = require('pg-promise')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha
var buckets = verb_utils.buckets
var default_region = verb_utils.region_mx
var max_score = verb_utils.maxscore
var min_score = verb_utils.minscore
/**
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 **/
exports.getTaxonsGroupRequest = function(req, res, next) {
  
  debug('getCounsTaxonsGroupRequest')

  var data_request = {}
  var data_target = {}
  var str_query = ''

  var grid_resolution = verb_utils.getParam(req, 'grid_resolution', 16)
  var region = parseInt(verb_utils.getParam(req, 'region', verb_utils.region_mx))

  data_request["region"] = region
  data_request["res_celda"] = "cells_"+grid_resolution+"km"
  data_request["res_celda_sp"] = "cells_"+grid_resolution+"km_"+region 
  data_request["res_celda_snib"] = "gridid_"+grid_resolution+"km" 
  data_request["res_celda_snib_tb"] = "grid_geojson_" + grid_resolution + "km_aoi"
  data_request["min_occ"] = verb_utils.getParam(req, 'min_cells', 1)

  var target_group = verb_utils.getParam(req, 'target_taxons', []); 
  var where_target = verb_utils.getWhereClauseFromGroupTaxonArray(target_group)
  data_request["target_name"] = verb_utils.getParam(req, 'target_name', 'target_group')
  data_request["where_target"] = where_target

  var covars_groups = verb_utils.getParam(req, 'covariables_taxons', []) 
  
  data_request["alpha"] = undefined

  pool.task(t => {

          return t.one(queries.basicAnalysis.getN, {

              grid_resolution: grid_resolution,
              footprint_region: region

          }).then(resp => {
              var N = resp.n
              data_request['N'] = N
              debug("Number total cells: " + N)

              data_request["alpha"] = data_request["alpha"] !== undefined ? data_request["alpha"] : 1.0/N
              debug("alpha:" + data_request["alpha"])
 
              var query = queries.countsTaxonGroups.getCountsBase
              
              data_request['groups'] = verb_utils.getCovarGroupQueries(queries, data_request, covars_groups)

              debug(query)
              debug(data_request)
              return t.any(query, data_request)

            }).then(data => {

              return res.json({"data":data})

            }).catch(error => {
                debug(error)
                return res.json({
                  ok: false,
                  error: "Error al ejecutar la petición"
                })
          })
  })
  
}






