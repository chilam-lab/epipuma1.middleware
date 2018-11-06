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

var pool = verb_utils.pool 
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha
var buckets = verb_utils.buckets
var default_region = verb_utils.region_mx
var max_score = verb_utils.maxscore
var min_score = verb_utils.minscore


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

  
  var data_request = verb_utils.getRequestParams(req, false)

  data_request["res_celda_snib_tb"] = "grid_geojson_" + data_request.grid_resolution + "km_aoi"

  // debug('region: ' + data_request.region)
  // debug('res_celda_snib_tb: ' + data_request.res_celda_snib_tb)


  //agregar iteraciones para el proceso de validacion
  // debug(data_request.hasBios)
  // debug(data_request.hasRaster)
  
  if (data_request.hasBios === true && data_request.hasRaster === false ) {

    debug('hasBios:true - hasRaster:false')

    debug('grid_resolution: ' + data_request.grid_resolution)
    debug('iterations: ' + data_request.iterations)

    var data_georel = [];
    var iter = 0;

    // for(var iter = 0; iter<data_request.iterations; iter++){
    // for(var index = 0; index<5; index++){

      // Inica tarea
      pool.task(t => {

          return t.one(queries.basicAnalysis.getN, {

              grid_resolution: data_request.grid_resolution,
              footprint_region: data_request.region

          }).then(resp => {

              
              data_request["N"] = resp.n 
              data_request["alpha"] = 1.0/resp.n 

              debug("N:" + data_request["N"])
              debug("alpha:" + data_request["alpha"])

              var query_bio;

              // seleccion de caso para obtener datos de especie ibjetivo
              if(data_request.caso === -1 && data_request.fossil.length == 0){
                debug("counts case 1: basico")
                // query_source = queries.basicAnalysis.getSource  
                query_bio = queries.basicAnalysis.getCountsBio
              }
              else if(data_request.caso === -1 && data_request.fossil.length > 1){
                debug("counts case 2: sin fosil")
                // query = queries.basicAnalysis.getSourceFossil
                query_bio = queries.basicAnalysis.getCountsBioFossil
              }
              else{
                debug("counts case 3: tiempo y posible fosil")
                // query = queries.basicAnalysis.getSourceTime  
                query_bio = queries.basicAnalysis.getCountsBioTime
              }


              // debug("data_request.get_grid_species: " + data_request.get_grid_species)
              if(data_request.get_grid_species !== false){

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

                  data_request["res_celda_snib_tb"] = "grid_geojson_" + data_request.grid_resolution + "km_aoi"

                  return t.any(query_bio, data_request)  

                })

              }
              else{

                debug("analisis general")

                data_request["cell_id"] = 0


                // Se obtiene todas las celdas para mandar valor de apriori o mapa de probabildiad
                if(data_request.apriori === true || data_request.mapa_prob === true){

                  debug("obteniendo todas las celdas, analisis con apriori o mapa de probabilidad - hasBios:true - hasRaster:false")

                  return t.one(queries.basicAnalysis.getAllGridId, data_request).then(data => {

                    debug("obteniendo counts BIO - hasBios:true - hasRaster:false")
                    // debug(data_request["where_config"] + " - hasBios:true - hasRaster:false")

                    data_request.all_cells = data
                    return t.any(query_bio, data_request)

                  })

                }
                else{

                  debug("analisis basico")

                  return t.any(query_bio, data_request)
                }
                

              }              
              

            })

      })
      .then(data => {

        debug("RETURN BIO - hasBios:true - hasRaster:false")

        // debug(data)

        
        var apriori = false
        debug("data_request.apriori: " + data_request.apriori)
        if(data_request.apriori !== false && data[0].ni !== undefined){
          apriori = true
          // debug(data_request.all_cells)
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
        

        // iter++;
        // debug("resp_iter: " + iter)
        // data_georel.push({
        //   data_iter: data,
        //   iter: iter
        // })
        

        var data_freq = data_request.with_data_freq === true ? verb_utils.processDataForFreqSpecie(data) : []
        var data_score_cell = data_request.with_data_score_cell === true ? verb_utils.processDataForScoreCell(data, apriori, mapa_prob, data_request.all_cells) : []
        var data_freq_cell = data_request.with_data_freq_cell === true ? verb_utils.processDataForFreqCell(data_score_cell) : []

        // debug('hasBios:true - hasRaster:false')
        // debug(data)

        // if(iter == 5){
          res.json({
            ok: true,
            usuarioRequest: req.usuarioRequest,
            data: data,
            data_freq: data_freq,
            data_score_cell: data_score_cell,
            data_freq_cell: data_freq_cell
          });
        // }
     

      })
      .catch(error => {
          // imprime error en servidor
          debug(error)

          return res.json({
            ok: false,
            error: "Error al ejecutar la petición"
          });
      });

  
  }
  else if (data_request.hasBios === false && data_request.hasRaster === true ) {

    debug('Caso: hasBios:false - hasRaster:true')
    // debug('grid_resolution: ' + data_request.grid_resolution)
    // debug('res_celda_snib: ' + data_request.res_celda_snib)
    // debug('res_celda_snib_tb: ' + data_request.res_celda_snib_tb)

    // Inica tarea
    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            grid_resolution: data_request.grid_resolution,
            footprint_region: data_request.region

        }).then(resp => {

            var query_abio;

            data_request["N"] = resp.n
            data_request["alpha"] = 1.0/resp.n 

            debug("N:" + data_request["N"])
            debug("alpha:" + data_request["alpha"])

            // seleccion de caso para obtener datos de especie ibjetivo
            if(data_request.caso === -1 && data_request.fossil.length == 0){
              debug("counts case 1: basico")
              query_abio = queries.basicAnalysis.getCountsAbio
            }
            else{
              debug("counts case 2: fossil - time")
              query_abio = queries.basicAnalysis.getCountsAbioFossilTime
            }


            debug("data_request.get_grid_species: " + data_request.get_grid_species)
              if(data_request.get_grid_species !== false){

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

                return t.one(queries.basicAnalysis.getGridIdByLatLong, data_request).then(resp => {

                  data_request["cell_id"] = resp.gridid
                  debug("cell_id: " + data_request.cell_id)

                  data_request["res_celda_snib_tb"] = "grid_geojson_" + data_request.grid_resolution + "km_aoi"

                  return t.any(query_abio, data_request)  

                })

              }
              else{

                debug("analisis general")

                data_request["cell_id"] = 0

                // Se obtiene todas las celdas para mandar valor de apriori o mapa de probabildiad
                if(data_request.apriori === true){

                  debug("obteniendo todas las celdas, analisis con apriori o mapa de probabilidad - hasBios:false - hasRaster:true")

                  return t.one(queries.basicAnalysis.getAllGridId, data_request).then(data => {

                    debug("obteniendo counts ABIO - hasBios:false - hasRaster:true")
                    // debug(data_request["where_config_raster"]  + " - hasBios:false - hasRaster:true")

                    data_request.all_cells = data
                    return t.any(query_abio, data_request)

                  })

                }
                else{

                  debug("analisis basico")

                  return t.any(query_abio, data_request)
                }

              }  


          })
        

    })
    .then(data => {

      debug("RETURN ABIO - hasBios:false - hasRaster:true")

        // debug(data)

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


        var data_freq = data_request.with_data_freq === true ? verb_utils.processDataForFreqSpecie(data) : []
        var data_score_cell = data_request.with_data_score_cell === true ? verb_utils.processDataForScoreCell(data, apriori, mapa_prob, data_request.all_cells) : []
        var data_freq_cell = data_request.with_data_freq_cell === true ? verb_utils.processDataForFreqCell(data_score_cell) : []

        // debug('hasBios:false - hasRaster:true')
        // debug(data)

        res.json({
          ok: true,
          usuarioRequest: req.usuarioRequest,
          data: data,
          data_freq: data_freq,
          data_score_cell: data_score_cell,
          data_freq_cell: data_freq_cell
        });

    })
    .catch(error => {
        debug(error)
        return res.json({
          ok: false,
          error: error
        });
    });


  }
  else if (data_request.hasBios === true && data_request.hasRaster === true ) {

    debug('Caso: hasBios:true - hasRaster:true')

    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            grid_resolution: data_request.grid_resolution,
            footprint_region: data_request.region

        }).then(resp => {

            data_request["N"] = resp.n
            data_request["alpha"] = 1.0/resp.n 

            debug("N:" + data_request["N"])
            debug("alpha:" + data_request["alpha"])

            var query

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


            debug("data_request.get_grid_species: " + data_request.get_grid_species)
              if(data_request.get_grid_species !== false){

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

                return t.one(queries.basicAnalysis.getGridIdByLatLong, data_request).then(resp => {

                  data_request["cell_id"] = resp.gridid
                  debug("cell_id: " + data_request.cell_id)

                  data_request["res_celda_snib_tb"] = "grid_geojson_" + data_request.grid_resolution + "km_aoi"

                  return t.any(query, data_request)  

                })

              }
              else{

                debug("analisis general")

                data_request["cell_id"] = 0

                // Se obtiene todas las celdas para mandar valor de apriori o mapa de probabildiad
                if(data_request.apriori === true){

                  debug("obteniendo todas las celdas, analisis con apriori o mapa de probabilidad - Caso: hasBios:true - hasRaster:true")
                  // debug('data_request: ' + data_request.where_config)
                  // debug('data_request: ' + data_request.where_config_raster)

                  return t.one(queries.basicAnalysis.getAllGridId, data_request).then(data => {

                    debug("obteniendo counts BOTH - hasBios:true - hasRaster:true")

                    data_request.all_cells = data
                    return t.any(query, data_request)

                  })

                }
                else{

                  debug("analisis basico")

                  return t.any(query, data_request)
                }

              }  

          })
        

    })
    .then(data => {

      debug("RETURN BOTH - hasBios:true - hasRaster:true")


        // var apriori = 0
        // if(!data_request.apriori && data[0].ni !== undefined){

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

        var data_freq = data_request.with_data_freq === true ? verb_utils.processDataForFreqSpecie(data) : []
        var data_score_cell = data_request.with_data_score_cell === true ? verb_utils.processDataForScoreCell(data, apriori, mapa_prob, data_request.all_cells) : []
        var data_freq_cell = data_request.with_data_freq_cell === true ? verb_utils.processDataForFreqCell(data_score_cell) : []

        // debug('hasBios:true - hasRaster:true')
        // debug(data)

        res.json({
          ok: true,
          usuarioRequest: req.usuarioRequest,
          data: data,
          data_freq: data_freq,
          data_score_cell: data_score_cell,
          data_freq_cell: data_freq_cell
        });

    })
    .catch(error => {
        debug(error)
        return res.json({
          ok: false,
          error: error
        });
    });


  }
  else{

    return res.status(400).send({
        ok: false,
        message: "Error en petición, sin caso asignado"});
  }

}






