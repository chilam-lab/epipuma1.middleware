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
  var data_iter = [];

  debug("Inicia proceso validacion")
  debug("iterations: " + data_request.iterations)
  debug("idtabla: " + data_request.idtabla) 

  
  if (data_request.hasBios === 'true' && data_request.hasRaster === 'false' ) {

    debug('Caso: hasBios:true - hasRaster:false')

    var cells_sin_sp = [];
    var response = data_request.iterations;
    var index = 0;

    for(var i=0; i<data_request.iterations; i++){

      pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {
          res_celda_snib_tb: data_request.res_celda_snib_tb
        }).then(resp => {

          
          data_request["N"] = resp.n 
          data_request["alpha"] = 1/resp.n 
          debug("N:" + data_request["N"])
          debug("alpha:" + data_request["alpha"])

          if(data_request.iterations === 1){

            data_request["test_cells_sinsp"] = [];
            data_request["test_cells_consp"] = [];

            // seleccion de caso para obtener datos de especie ibjetivo
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

            return t.any(query, data_request)

          }
          else{

            index = index+1;
            // debug("index ConSP: " + index)

            return t.one(queries.basicAnalysis.getTestIterConSP,{
              tbl_temp: data_request.idtabla,
              num_iter: index
            }).then(data_ConSP => {

              // debug("index SinSP: " + data_ConSP.index)
              // debug(data_SinSP)

              return t.one(queries.basicAnalysis.getTestIterSinSP,{
                tbl_temp: data_request.idtabla,
                num_iter: data_ConSP.index,
                cells: data_ConSP.cells
              }).then(data_complete => {

                debug("respuesta iter")
                debug(data_complete)

                data_request["test_cells_sinsp"] = data_complete.cells_sin_sp;
                data_request["test_cells_consp"] = data_complete.cells_con_sp;

                // seleccion de caso para obtener datos de especie ibjetivo
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

                return t.any(query, data_request)                  

              })

            })

          }

        })

      })
      .then(data => {

          data_iter.push({
            iter: response,
            data: data
          });
          response = response-1;
          

          if(response === 0){

            debug("respuesta final")
            
            if(data_request.iterations === 1){
              
              // debug("data_request.with_basic_data: " + data_request.with_basic_data)
              // debug("data_request.with_data_freq: " + data_request.with_data_freq)
              // debug("data_request.with_data_score_cell: " + data_request.with_data_score_cell)
              // debug("data_request.with_data_freq_cell: " + data_request.with_data_freq_cell)

              var data_freq = data_request.with_data_freq === "true" ? verb_utils.processDataForFreqSpecie(data) : []
              var data_score_cell = data_request.with_data_score_cell === "true" ? verb_utils.processDataForScoreCell(data) : []
              var data_freq_cell = data_request.with_data_freq_cell === "true" ? verb_utils.processDataForFreqCell(data_score_cell) : [];

            }
            else{

              //TODO: Proceso para conjuntar los resultados de cada iteración
              // debug(data_iter)
              var data = verb_utils.getAverageFromResults(data_iter);



            }


            res.json({
              ok: true,
              usuarioRequest: req.usuarioRequest,
              data: data,
              data_freq: data_freq,
              data_score_cell: data_score_cell,
              data_freq_cell: data_freq_cell
            });  


          }
          

      })
      .catch(error => {
        debug(error)
        return res.json({
          ok: false,
          error: error
        });
      });


    }  


  }
  else if (data_request.hasBios === 'false' && data_request.hasRaster === 'true' ) {

    debug('Caso: hasBios:false - hasRaster:true')

    var cells_sin_sp = [];
    var response = data_request.iterations;
    var index = 0;

    for(var i=0; i<data_request.iterations; i++){


      // Inica tarea
      pool.task(t => {

          return t.one(queries.basicAnalysis.getN, {

              res_celda_snib_tb: data_request.res_celda_snib_tb

          }).then(resp => {

              data_request["N"] = resp.n 
              data_request["alpha"] = 1/resp.n 
              debug("N:" + data_request["N"])
              debug("alpha:" + data_request["alpha"])

              if(data_request.iterations === 1){

                // seleccion de caso para obtener datos de especie ibjetivo
                if(data_request.caso === -1 && data_request.fossil.length == 0){
                  debug("counts case 1: basico")
                  query = queries.basicAnalysis.getCountsAbio
                }
                else{
                  debug("counts case 2: fossil - time")
                  query = queries.basicAnalysis.getCountsAbioFossilTime
                }

                return t.any(query, data_request)


              }
              else{

                index = index+1;
                // debug("index ConSP: " + index)

                return t.one(queries.basicAnalysis.getTestIterConSP,{
                  tbl_temp: data_request.idtabla,
                  num_iter: index
                }).then(data_ConSP => {

                  // debug("index SinSP: " + data_ConSP.index)
                  // debug(data_SinSP)

                  return t.one(queries.basicAnalysis.getTestIterSinSP,{
                    tbl_temp: data_request.idtabla,
                    num_iter: data_ConSP.index,
                    cells: data_ConSP.cells
                  }).then(data_complete => {

                    debug("respuesta iter")
                    debug(data_complete)

                    data_request["test_cells_sinsp"] = data_complete.cells_sin_sp;
                    data_request["test_cells_consp"] = data_complete.cells_con_sp;

                    // seleccion de caso para obtener datos de especie ibjetivo
                    if(data_request.caso === -1 && data_request.fossil.length == 0){
                      debug("counts case 1: basico")
                      query = queries.basicAnalysis.getCountsAbio
                    }
                    else{
                      debug("counts case 2: fossil - time")
                      query = queries.basicAnalysis.getCountsAbioFossilTime
                    }

                    return t.any(query, data_request)                  

                  })

                })

              }

            })
          

      })
      .then(data => {


          data_iter.push({
            iter: response,
            data: data
          });
          response = response-1;
          

          if(response === 0){

            debug("respuesta final")
            
            if(data_request.iterations === 1){
              
              // debug("data_request.with_basic_data: " + data_request.with_basic_data)
              // debug("data_request.with_data_freq: " + data_request.with_data_freq)
              // debug("data_request.with_data_score_cell: " + data_request.with_data_score_cell)
              // debug("data_request.with_data_freq_cell: " + data_request.with_data_freq_cell)

              var data_freq = data_request.with_data_freq === "true" ? verb_utils.processDataForFreqSpecie(data) : []
              var data_score_cell = data_request.with_data_score_cell === "true" ? verb_utils.processDataForScoreCell(data) : []
              var data_freq_cell = data_request.with_data_freq_cell === "true" ? verb_utils.processDataForFreqCell(data_score_cell) : [];

            }
            else{

              //TODO: Proceso para conjuntar los resultados de cada iteración
              // debug(data_iter)
              var data = verb_utils.getAverageFromResults(data_iter);



            }


            res.json({
              ok: true,
              usuarioRequest: req.usuarioRequest,
              data: data,
              data_freq: data_freq,
              data_score_cell: data_score_cell,
              data_freq_cell: data_freq_cell
            });  


          }


      })
      .catch(error => {
          debug(error)
          return res.json({
            ok: false,
            error: error
          });
      });



    }

    


  }
  else if (data_request.hasBios === 'true' && data_request.hasRaster === 'true' ) {

    debug('Caso: hasBios:true - hasRaster:true')

    var cells_sin_sp = [];
    var response = data_request.iterations;
    var index = 0;

    for(var i=0; i<data_request.iterations; i++){

      pool.task(t => {

          return t.one(queries.basicAnalysis.getN, {

              res_celda_snib_tb: data_request.res_celda_snib_tb

          }).then(resp => {

              data_request["N"] = resp.n 
              data_request["alpha"] = 1/resp.n 
              debug("N:" + data_request["N"])
              debug("alpha:" + data_request["alpha"])

              if(data_request.iterations === 1){

                // seleccion de caso para obtener datos de especie ibjetivo
                if(data_request.caso === -1 && data_request.fossil.length == 0){
                  debug("counts case 1: basico")
                  query = queries.basicAnalysis.getCounts
                }
                else if(data_request.caso === -1 && data_request.fossil.length > 1){
                  debug("counts case 2: sin fosil")
                  query = queries.basicAnalysis.getCountsFossil
                }
                else{
                  debug("counts case 3: tiempo y posible fosil")
                  query = queries.basicAnalysis.getCountsTime
                }

                return t.any(query, data_request)

              }
              else{

                index = index+1;
                // debug("index ConSP: " + index)

                return t.one(queries.basicAnalysis.getTestIterConSP,{
                  tbl_temp: data_request.idtabla,
                  num_iter: index
                }).then(data_ConSP => {

                  // debug("index SinSP: " + data_ConSP.index)
                  // debug(data_SinSP)

                  return t.one(queries.basicAnalysis.getTestIterSinSP,{
                    tbl_temp: data_request.idtabla,
                    num_iter: data_ConSP.index,
                    cells: data_ConSP.cells
                  }).then(data_complete => {

                    debug("respuesta iter")
                    debug(data_complete)

                    data_request["test_cells_sinsp"] = data_complete.cells_sin_sp;
                    data_request["test_cells_consp"] = data_complete.cells_con_sp;

                    // seleccion de caso para obtener datos de especie ibjetivo
                    if(data_request.caso === -1 && data_request.fossil.length == 0){
                      debug("counts case 1: basico")
                      query = queries.basicAnalysis.getCounts
                    }
                    else if(data_request.caso === -1 && data_request.fossil.length > 1){
                      debug("counts case 2: sin fosil")
                      query = queries.basicAnalysis.getCountsFossil
                    }
                    else{
                      debug("counts case 3: tiempo y posible fosil")
                      query = queries.basicAnalysis.getCountsTime
                    }

                    return t.any(query, data_request)                  

                  })

                })

              }

            })
          

      })
      .then(data => {

        data_iter.push({
          iter: response,
          data: data
        });
        response = response-1;
        

        if(response === 0){

          debug("respuesta final")
          
          if(data_request.iterations === 1){
            
            // debug("data_request.with_basic_data: " + data_request.with_basic_data)
            // debug("data_request.with_data_freq: " + data_request.with_data_freq)
            // debug("data_request.with_data_score_cell: " + data_request.with_data_score_cell)
            // debug("data_request.with_data_freq_cell: " + data_request.with_data_freq_cell)

            var data_freq = data_request.with_data_freq === "true" ? verb_utils.processDataForFreqSpecie(data) : []
            var data_score_cell = data_request.with_data_score_cell === "true" ? verb_utils.processDataForScoreCell(data) : []
            var data_freq_cell = data_request.with_data_freq_cell === "true" ? verb_utils.processDataForFreqCell(data_score_cell) : [];

          }
          else{

            //TODO: Proceso para conjuntar los resultados de cada iteración
            // debug(data_iter)
            var data = verb_utils.getAverageFromResults(data_iter);

          }


          res.json({
            ok: true,
            usuarioRequest: req.usuarioRequest,
            data: data,
            data_freq: data_freq,
            data_score_cell: data_score_cell,
            data_freq_cell: data_freq_cell
          });  


        }

      })
      .catch(error => {
          debug(error)
          return res.json({
            ok: false,
            error: error
          });
      });


    }

  }
  else{

    return res.status(400).send({
        ok: false,
        message: "Error en petición"});
  }

}






