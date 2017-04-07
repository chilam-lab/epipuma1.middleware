/**
* getFreqMapNiche module
*
* Este verbo regresa la frecuencia del score por celda para poder desplegar el
* mapa de probabilidad
*
* @module controllers/getFreqMapNiche
*/
var debug = require('debug')('verbs:getFreqMapNiche')
var pgp = require('pg-promise')()
var moment = require('moment')
var verb_utils = require('./verb_utils')

var config = require('../config')
var queries = require('./sql/queryProvider')

var pool= pgp(config.db)
var N = verb_utils.N 


/**
 *
 * getFreqMapNiche_M de SNIB DB, mapa de probabilidad
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

function getFreqMapNiche_M(req, res, next) {

  debug('getFreqMapNiche_M')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
    // var N           = 14707
  var maxscore    = 700
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')

    // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

    // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var mapa_prob       = verb_utils.getParam(req, 'mapa_prob')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
    
  if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

    debug('TM')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapM, {
      spid: spid,
      N: N,
      alpha: alpha,
      maxscore: maxscore,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted
    })
            .then(function (data) {
              res.json({'data': data})
            })
            .catch(function (error) {
              debug(error)
              next(error)
            })

      
  }
  else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ){

    debug('BM')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapBioM, {
      spid: spid,
      N: N,
      alpha: alpha,
      maxscore: maxscore,
      min_occ: min_occ,
      where_config: whereVar,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

      
  } 
  else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

    debug('RaM')

    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    console.log(queries.getFreqMapNiche.getFreqMapRaM)

    pool.any(queries.getFreqMapNiche.getFreqMapRaM, {
      spid: spid,
      N: N,
      alpha: alpha,
      maxscore: maxscore,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted
    })
          .then(function (data) {
            res.json({'data': data})
          })
          .catch(function (error) {
            debug(error)
            next(error)
          })
      
  } 
  else{

    next()
  }

}




/**
 *
 * getFreqMapNiche_A de SNIB DB, apriori
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


function getFreqMapNiche_A(req, res, next) {

  debug('getFreqMapNiche_A')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
    // var N           = 14707
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

    // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

    // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var apriori         = verb_utils.getParam(req, 'apriori')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

    
  if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

    debug('TA')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
            .then(function (data) {
              res.json({'data': data})
            })
            .catch(function (error) {
              debug(error)
              next(error)
            })

      
  }
  else if (hasBios === 'true' && apriori === 'apriori' ){

    debug('BA')

    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapBioA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

      
  } 
  else if (hasRaster === 'true' && apriori === 'apriori' ){

    debug('RaA')

    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapRaA, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
          .then(function (data) {
            res.json({'data': data})
          })
          .catch(function (error) {
            debug(error)
            next(error)
          })
      
  } 
  else{

    next()
  }

}


/**
 *
 * getFreqMapNiche_T de SNIB DB, sin filtros
 *
 * Obtiene frecuencia score por celda para desplegar el mapa de probabilidad
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

function getFreqMapNiche_T(req, res, next) {

  debug('getFreqMapNiche_T')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')


    // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

    // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
    
    // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

    // debug(discardedFilterids)

    
  if (hasBios === 'true' && hasRaster === 'true' && discardedFilterids === 'true'){

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      // debug(caso)


    debug('T')  

    whereVar = verb_utils.processBioFilters(tfilters, spid)
    whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getFreqMapNiche.getFreqMapT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        // debug(data)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

     
      

  }
  else if (hasBios === 'true' && discardedFilterids === 'true' ){

    debug('B')

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      // debug(caso);  

    whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)
      
    pool.any(queries.getFreqMapNiche.getFreqMapBioT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        // debug(data)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
  } 
  else if (hasRaster === 'true' && discardedFilterids === 'true' ){

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      // debug(caso)


    debug('Ra')

    whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
    pool.any(queries.getFreqMapNiche.getFreqMapRaT, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        // debug(data)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
  } 
  else{

    next()
  }

    

}



/**
 *
 * getFreqMapNiche de SNIB DB, sin filtros
 *
 * Obtiene frecuencia score por celda para desplegar el mapa de probabilidad
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

function getFreqMapNiche(req, res, next) {

  debug('getFreqMapNiche')

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  var alpha       = 0.01
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
    // var N           = 14707; // Verificar N, que se esta contemplando


    // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

    // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
    // console.log(discardedDeleted);


    // var download       = verb_utils.getParam(req, 'download', false)
    // if(download){

    //     debug("download");  

    //     var mail    = verb_utils.getParam(req, 'mail')
    //     var ftype   = verb_utils.getParam(req, 'ftype')
    //     var query = pool.as.format(queries.getFreqMapNiche.getFreqMapBio, {
    //         spid: spid,
    //         N: N,
    //         alpha: alpha,
    //         min_occ: min_occ,
    //         where_config: whereVar,
    //         res_celda: res_celda,
    //         addgeom: "geom, "
    //     })
    //     debug(query)

    //     var json={}
    //     json["query"] = query
    //     json["mail"] = mail
    //     json["ftype"] = ftype
    //     json["qtype"] = "setQuery"
    //     json = JSON.stringify(json)
      
    //     http.request({  
    //           host : "http://species.conabio.gob.mx/niche2?", // "localhost", 
    //           port : 9011, 
    //           path : "/",
    //           method : "POST"
    //       }, 
    //       function (response) {
    //           var body = ""; 
    //           response.on("data", function(chunk){
    //                 body += chunk
    //               }
    //           ); 
    //           response.on("end",  res.json({'data': "success"})  ); 
    //       }
    //     ).end(JSON.stringify(json))

    // }

    
  if (hasBios === 'true' && hasRaster === 'true' ){

    debug('T')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMap, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

      
  }
  else if (hasBios === 'true'){

    debug('B')
    var whereVar = verb_utils.processBioFilters(tfilters, spid)


    pool.any(queries.getFreqMapNiche.getFreqMapBio, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config: whereVar,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) { 
        res.json({'data': data})  
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

      
  } 
  else if (hasRaster === 'true'){

    debug('Ra')
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

    pool.any(queries.getFreqMapNiche.getFreqMapRaster, {
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
  } 
  else{

    next()
  }

}

exports.pipe = [
  // getFreqMap_TM,
  // getFreqMap_TA,
  getFreqMapNiche_M,
  getFreqMapNiche_A,
  getFreqMapNiche_T,
  getFreqMapNiche    
]
