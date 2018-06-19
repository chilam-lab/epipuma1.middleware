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

  var footprint_region = parseInt(verb_utils.getParam(req, 'footprint_region', 1))
  var country = verb_utils.getRegionCountry(footprint_region)

  var data_request = verb_utils.getRequestParams(req, false)

  
  if (data_request.hasBios === 'true' && data_request.hasRaster === 'false' ) {

    debug('Caso: hasBios:true - hasRaster:false')

    // Inica tarea
    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            res_celda_snib_tb: data_request.res_celda_snib_tb,
            country: country

        }).then(resp => {

            debug("N:" + resp.n)
            data_request["N"] = resp.n 

            // seleccion de caso para obtener datos de especie ibjetivo
            if(data_request.caso === -1 && data_request.fossil.length == 0){
              debug("counts case 1: basico")
              // query_source = queries.basicAnalysis.getSource  
              query = queries.basicAnalysis.getCountsBio
            }
            else if(data_request.caso === -1 && data_request.fossil.length > 1){
              debug("counts case 2: sin fosil")
              // query = queries.basicAnalysis.getSourceFossil
              query = queries.basicAnalysis.getCountsBioFossil
            }
            else{
              debug("counts case 3: tiempo y posible fosil")
              // query = queries.basicAnalysis.getSourceTime  
              query = queries.basicAnalysis.getCountsBioTime
            }

            return t.any(query, data_request)

          })

    })
    .then(data => {

      debug("data_request.with_basic_data: " + data_request.with_basic_data)
      debug("data_request.with_data_freq: " + data_request.with_data_freq)
      debug("data_request.with_data_score_cell: " + data_request.with_data_score_cell)
      debug("data_request.with_data_freq_cell: " + data_request.with_data_freq_cell)

        var data_freq = data_request.with_data_freq === "true" ? verb_utils.processDataForFreqSpecie(data) : []
        var data_score_cell = data_request.with_data_score_cell === "true" ? verb_utils.processDataForScoreCell(data) : []
        var data_freq_cell = data_request.with_data_freq_cell === "true" ? verb_utils.processDataForFreqCell(data_score_cell) : [];

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
  else if (data_request.hasBios === 'false' && data_request.hasRaster === 'true' ) {

    debug('Caso: hasBios:false - hasRaster:true')

    // Inica tarea
    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            res_celda_snib_tb: data_request.res_celda_snib_tb

        }).then(resp => {

            // debug("N:" + resp.n)
            data_request["N"] = resp.n 


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
    .then(data => {

        var data_freq = data_request.with_data_freq === "true" ? verb_utils.processDataForFreqSpecie(data) : []
        var data_score_cell = data_request.with_data_score_cell === "true" ? verb_utils.processDataForScoreCell(data) : []
        var data_freq_cell = data_request.with_data_freq_cell === "true" ? verb_utils.processDataForFreqCell(data_score_cell) : [];

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
  else if (data_request.hasBios === 'true' && data_request.hasRaster === 'true' ) {

    debug('Caso: hasBios:true - hasRaster:true')

    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            res_celda_snib_tb: data_request.res_celda_snib_tb

        }).then(resp => {

            // debug("N:" + resp.n)
            data_request["N"] = resp.n

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

            return t.any(query, data_request)

          })
        

    })
    .then(data => {

        var data_freq = data_request.with_data_freq === "true" ? verb_utils.processDataForFreqSpecie(data) : []
        var data_score_cell = data_request.with_data_score_cell === "true" ? verb_utils.processDataForScoreCell(data) : []
        var data_freq_cell = data_request.with_data_freq_cell === "true" ? verb_utils.processDataForFreqCell(data_score_cell) : [];

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
        message: "Error en petición"});
  }

}






