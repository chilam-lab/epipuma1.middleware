/**
* Este verbo es responsable de obtener los valores de epsilon y score entre una
* especie objetivo y un conjunto de variables bióticas y raster.
*
* @module controllers/getScoreDecilNiche
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getCounts')
var moment = require('moment')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')
var d3 = require('d3')

var pool = verb_utils.pool 
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha
var buckets = verb_utils.buckets
var default_region = verb_utils.region_mx
var max_score = verb_utils.maxscore
var min_score = verb_utils.minscore
var request_counter = 0;
var request_counter_map = d3.map([]);


/**
 * Obtiene el score por celda agrupado por decil con apriori
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
exports.getBasicInfoTemp = function(req, res, next) {
  
  debug('getBasicInfoTemp')

  var data_request = verb_utils.getRequestParams(req, true)

  data_request["res_celda_snib_tb"] = "grid_geojson_" + data_request.grid_resolution + "km_aoi"
  data_request["res_grid_tbl"] = "grid_" + data_request.grid_resolution + "km_aoi"
  data_request["res_grid_column"] = "gridid_" + data_request.grid_resolution + "km"

  // debug('region: ' + data_request.region)
  // debug('res_celda_snib_tb: ' + data_request.res_celda_snib_tb)

  var data_georel = [];
  var iter = 0;
  var promises = []
  var json_response = {}

  for(var iter = 0; iter<data_request.iterations; iter++){

    // debug("iteration:" + (iter+1))
    initialProcessTemp(iter, data_request.iterations, data_request, res, json_response, req)

  }

}

function initialProcessTemp(iter, total_iterations, data, res, json_response, req) {


}









/**
 * Obtiene el score por celda agrupado por decil con apriori
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
exports.getBasicInfo = function(req, res, next) {
  
  debug('getBasicInfo')

  var data_request = verb_utils.getRequestParams(req, true)

  data_request["res_celda_snib_tb"] = "grid_geojson_" + data_request.grid_resolution + "km_aoi"
  data_request["res_grid_tbl"] = "grid_" + data_request.grid_resolution + "km_aoi"
  data_request["res_grid_column"] = "gridid_" + data_request.grid_resolution + "km"

  // debug('region: ' + data_request.region)
  // debug('res_celda_snib_tb: ' + data_request.res_celda_snib_tb)

  var data_georel = [];
  var iter = 0;
  var promises = []
  var json_response = {}

  for(var iter = 0; iter<data_request.iterations; iter++){

    // debug("iteration:" + (iter+1))
    initialProcess(iter, data_request.iterations, data_request, res, json_response, req)

  }

}



function initialProcess(iter, total_iterations, data, res, json_response, req) {

  
  var data_request = JSON.parse(JSON.stringify(data));
  // debug(data_request)

  pool.task(t => {

    var query = data_request.idtabla === "" ? "select array[]::integer[] as total_cells" : queries.validationProcess.getTotalCells
    // debug(query)

    return t.one(query, {

        tbl_process: data_request.idtabla,
        iter: (iter+1)

    })
    .then(resp => { 

      // debug("iter TC: " + (iter+1))
      data_request["total_cells"] = resp.total_cells

      var query = data_request.idtabla === "" ? "select array[]::integer[] as source_cells" : queries.validationProcess.getSourceCells
      // debug(query)

      return t.one(query, {
      // return t.any(query, {
        tbl_process: data_request.idtabla,
        iter: (iter+1),
        res_grid_tbl: data_request.res_grid_tbl,
        res_grid_column: data_request.res_grid_column

      })
      .then(resp => {

        // debug(resp)
        // debug("HOLA**********")
        // debug(resp.map(function(d) {return d.spids}))
        data_request["source_cells"] = resp.source_cells
        // data_request["source_cells"] = data_request.idtabla === "" ? [] : resp.map(function(d) {return d.cell}) 
        // data_request["test_cells"] = data_request.idtabla === "" ? [] : resp.map(function(d) {return {cell:d.cell, spids:d.spids, iter:iter+1} }) 
        
        // debug(data_request["source_cells"])
        // debug(data_request["total_cells"])

        return t.one(queries.basicAnalysis.getN, {

            grid_resolution: data_request.grid_resolution,
            footprint_region: data_request.region

        }).then(resp => {

          data_request["N"] = resp.n 
          data_request["alpha"] = data_request["alpha"] !== undefined ? data_request["alpha"] : 1.0/resp.n

          debug("N:" + data_request["N"])
          debug("alpha:" + data_request["alpha"])

          var case_query = getCaseQuery(data_request)

          //TODO: añadir caso seleccion de celda
          if( data_request.get_grid_species !== false){

            debug("analisis en celda")

            var lat = verb_utils.getParam(req, 'lat')
            var long = verb_utils.getParam(req, 'long')

            debug("lat: " + lat)
            debug("long: " + long)

            data_request["lat"] = lat
            data_request["long"] = long

            // sobreescribe tablas de vistas por tablas de grid_16km_aoi
            var grid_resolution = data_request.grid_resolution
            data_request["res_celda_sp"] = "cells_"+grid_resolution+"km" 
            data_request["res_celda_snib"] = "gridid_"+grid_resolution+"km" 
            data_request["res_celda_snib_tb"] = "grid_"+grid_resolution+"km_aoi" 

            debug('res_celda_snib_tb: ' + data_request.res_celda_snib_tb)
            debug("cells : " + data_request.res_celda_sp)

            return t.one(queries.basicAnalysis.getGridIdByLatLong, data_request).then(resp => {

              data_request["cell_id"] = resp.gridid
              debug("cell_id: " + data_request.cell_id)
              debug("where_config: " + data_request.where_config)


              data_request["res_celda_snib_tb"] = "grid_geojson_" + data_request.grid_resolution + "km_aoi"

              return t.any(case_query, data_request)  

            })

          }
          else{

            debug("analisis general")

            data_request["cell_id"] = 0


            // Se obtiene todas las celdas para mandar valor de apriori o mapa de probabildiad
            if( (data_request.apriori === true || data_request.mapa_prob === true) || (data_request.apriori === "true" || data_request.mapa_prob === "true") ){

              // debug("obteniendo todas las celdas, analisis con apriori o mapa de probabilidad - hasBios:true - hasRaster:false")

              return t.one(queries.basicAnalysis.getAllGridId, data_request).then(data => {

                // debug("obteniendo counts BIO - hasBios:true - hasRaster:false")
                // debug(data_request["where_config"] + " - hasBios:true - hasRaster:false")

                data_request.all_cells = data
                return t.any(case_query, data_request)

              })

            }
            else{

              debug("analisis basico")

              return t.any(case_query, data_request)
            }
            

          }


        })

      })
        
    })

  })
  .then(data_iteration => {

    // TODO: agregar valores necesarios para validacion del data_request
    var data_response = {iter: (iter+1), data: data_iteration, test_cells: data_request["source_cells"], apriori: data_request.apriori, mapa_prob: data_request.mapa_prob }
    json_response["data_response"] = json_response["data_response"] === undefined ? [data_response] : json_response["data_response"].concat(data_response)

    if(!request_counter_map.has(data_request["title_valor"].title)){
      request_counter_map.set(data_request["title_valor"].title, 1)
    }
    else{
      var count = request_counter_map.get(data_request["title_valor"].title);
      request_counter_map.set(data_request["title_valor"].title, count+1)
    }

    // request_counter = request_counter + 1

    debug("request_counter: " + request_counter_map.get(data_request["title_valor"].title) + " - title_valor: " + data_request["title_valor"].title)
    
    
    if(request_counter_map.get(data_request["title_valor"].title) === total_iterations){

      request_counter_map.set(data_request["title_valor"].title, 0)
      
      debug("COUNT PROCESS FINISHED")
      var data = []
      var validation_data = []
      var is_validation = false

      if(total_iterations !== 1){
        debug("PROCESS RESULTS FOR VALIDATION")
        data = verb_utils.processValidationData(json_response["data_response"])
        validation_data = verb_utils.getValidationValues(json_response["data_response"])
        is_validation = true
      }
      else{
        data = data_iteration
        is_validation = false
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

      var cell_id = 0
      if(data_request.get_grid_species !== false){

        cell_id = data_request.cell_id
        debug("cell_id last: " + cell_id)
        data = verb_utils.processDataForCellId(data, apriori, mapa_prob, cell_id)

      }

      // debug("with_data_freq: " + data_request.with_data_freq === true)
      debug("COMPUTE RESULT DATA FOR HISTOGRAMS")
      var data_freq = data_request.with_data_freq === true ? verb_utils.processDataForFreqSpecie(data) : []
      var data_score_cell = data_request.with_data_score_cell === true ? verb_utils.processDataForScoreCell(data, apriori, mapa_prob, data_request.all_cells, is_validation) : []
      var data_freq_cell = data_request.with_data_freq_cell === true ? verb_utils.processDataForFreqCell(data_score_cell) : []


      res.json({
          ok: true,
          // usuarioRequest: req.usuarioRequest,
          data: data,
          data_freq: data_freq,
          data_score_cell: data_score_cell,
          data_freq_cell: data_freq_cell,
          validation_data: validation_data
        });
      
      
    }
        

  })
  .catch(error => {
      // imprime error en servidor
      debug("ERROR EN PROMESA")
      debug(error)

      res.json({
        ok: false,
        message: "Error al ejecutar la petición",
        error: error
      });
  })
  

}

function getCaseQuery(data_request){

  var query;

  if ( data_request.hasBios == true && data_request.hasRaster == false  ) {
    debug('hasBios:true - hasRaster:false')

    // seleccion de caso para obtener datos de especie objetivo
    if(data_request.caso === -1 && data_request.fossil.length == 0){
      debug("counts case 1: basico")
      query = queries.basicAnalysis.getCountsBio
    }
    else if(data_request.caso === -1 && data_request.fossil.length > 1){
      debug("counts case 2: sin fosil")
      query = queries.basicAnalysis.getCountsBioFossil
    }
    else{
      debug("counts case 3: tiempo y posible fosil")
      query = queries.basicAnalysis.getCountsBioTime
    }

    return query


  }
  else if ( data_request.hasBios == false && data_request.hasRaster == true ) {
    debug('Caso: hasBios:false - hasRaster:true')

    // seleccion de caso para obtener datos de especie objetivo
    if(data_request.caso === -1 && data_request.fossil.length == 0){
      debug("counts case 1: basico")
      query = queries.basicAnalysis.getCountsAbio
    }
    else{
      debug("counts case 2: fossil - time")
      query = queries.basicAnalysis.getCountsAbioFossilTime
    }

    return query


  }
  else if ( data_request.hasBios == true && data_request.hasRaster == true ) {
    debug('Caso: hasBios:true - hasRaster:true')

    // seleccion de caso para obtener datos de especie ibjetivo
    if(data_request.caso === -1 && data_request.fossil.length == 0){
      debug("counts case 1: basico")
      query = queries.basicAnalysis.getCounts
    }
    else if(data_request.caso === -1 && data_request.fossil.length > 1){
      debug("counts case 2: sin fosil")
      // query = queries.basicAnalysis.getSourceFossil
      query = queries.basicAnalysis.getCountsFossil
    }
    else{
      debug("counts case 3: tiempo y posible fosil")
      // query = queries.basicAnalysis.getSourceTime  
      query = queries.basicAnalysis.getCountsTime
    }

    return query


  }
  else{

    return res.status(400).send({
        ok: false,
        message: "Error en petición, sin caso asignado"});
  }


}






