/**
* Este verbo regresa la frecuencia del score por celda para poder desplegar el
* mapa de probabilidad
*
* @module controllers/getFreqMapNiche
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getCellScoreNiche')
var pgp = require('pg-promise')()
var moment = require('moment')

var config = require('../config')
var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool= pgp(config.db)
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha


/**
 * Obtiene la suma de socre por celda para desplegar en el mapa de probabilidad
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqMapNiche_M(req, res, next) {
  debug('getFreqMapNiche_M')
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  // var alpha       = 0.01
  // var N           = 14707
  var maxscore    = 700
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var mapa_prob       = verb_utils.getParam(req, 'mapa_prob')

  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  // debug(sfosil)
  var lb_fosil      = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  // debug(lb_fosil)

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  debug("iterations: " + iter)

  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

  debug("idtabla: " + idtabla)

   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  filter_time = false;
    
  if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){
    debug('TM')
     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    debug('res_celda: ' + res_celda)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapM, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      maxscore: maxscore,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  }
  else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ) {
    debug('BM')
     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    debug('res_celda: ' + res_celda)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapBioM, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      maxscore: maxscore,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ) {
    debug('RaM')
    //  var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    // debug('caso: ' + caso)

    // filter_time = caso !== -1 ? true : filter_time
    // debug('filter_time: ' + filter_time)

    // res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    // debug('res_celda: ' + res_celda)

    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    // debug(queries.getFreqMapNiche.getFreqMapRaM)

    pool.any(queries.getFreqMapNiche.getFreqMapRaM, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      maxscore: maxscore,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else {
    next()
  }
}


/**
 * Obtiene la suma de score por celda para desplegar en el mapa con apriori
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqMapNiche_A(req, res, next) {

  debug('getFreqMapNiche_A')
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  // var alpha       = 0.01
  // var N           = 14707
  var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')

  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  // debug(sfosil)
  var lb_fosil      = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  // debug(lb_fosil)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var apriori         = verb_utils.getParam(req, 'apriori')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  
  debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  debug("iterations: " + iter)

  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

  debug("idtabla: " + idtabla)

   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  filter_time = false;

    
  if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ) {
    debug('TA')
     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    debug('res_celda: ' + res_celda)

    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapA, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  }
  else if (hasBios === 'true' && apriori === 'apriori' ) {
    debug('BA')

     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    debug('res_celda: ' + res_celda)


    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapBioA, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else if (hasRaster === 'true' && apriori === 'apriori' ) {
    debug('RaA')

    //  var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    // debug('caso: ' + caso)

    // filter_time = caso !== -1 ? true : filter_time
    // debug('filter_time: ' + filter_time)

    // res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    // debug('res_celda: ' + res_celda)


    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapRaA, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config_raster: whereVarRaster,
      res_celda: res_celda,
      res_grid: res_grid,
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
    })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
  } 
  else {
    next()
  }
}


/**
 * Obtiene frecuencia score por celda para desplegar el mapa de probabilidad
 * con filtro temporal
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
// function getFreqMapNiche_T(req, res, next) {
//   debug('getFreqMapNiche_T')
//   var spid        = parseInt(verb_utils.getParam(req, 'id'))
//   var tfilters    = verb_utils.getParam(req, 'tfilters')
//   var alpha       = 0.01
//   // var N           = 14707; // Verificar N, que se esta contemplando
//   var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
//   var res_grid = verb_utils.getParam(req, 'res_grid', 'gridid_16km')


//   // Siempre incluidos en query, nj >= 0
//   var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

//   // variables configurables
//   var hasBios         = verb_utils.getParam(req, 'hasBios')
//   var hasRaster       = verb_utils.getParam(req, 'hasRaster')
    
//   // filtros por tiempo
//   var sfecha            = verb_utils.getParam(req, 'sfecha', false)
//   var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'),
//                                  ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'],
//                                  'es')
//   var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', 
//                                                      moment().
//                                                      format('YYYY-MM-DD')), 
//                                  ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
//   var discardedFilterids = verb_utils.getParam(req, 'discardedDateFilterids')

//   var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
//   // debug(discardedFilterids)
    
//   if (hasBios === 'true' && hasRaster === 'true' && 
//       discardedFilterids === 'true') {
//     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
//     // debug(caso)

//     debug('T')  

//     whereVar = verb_utils.processBioFilters(tfilters, spid)
//     whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
//     pool.any(queries.getFreqMapNiche.getFreqMapT, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config: whereVar,
//       where_config_raster: whereVarRaster,
//       lim_inf: fecha_incio.format('YYYY'),
//       lim_sup: fecha_fin.format('YYYY'),
//       caso: caso,
//       res_celda: res_celda,
//       res_grid: res_grid,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         // debug(data)
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   }
//   else if (hasBios === 'true' && discardedFilterids === 'true' ) {
//     debug('B')
//     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
//     // debug(caso);  

//     var whereVar = verb_utils.processBioFilters(tfilters, spid)
//     // debug(whereVar)
      
//     pool.any(queries.getFreqMapNiche.getFreqMapBioT, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config: whereVar,
//       lim_inf: fecha_incio.format('YYYY'),
//       lim_sup: fecha_fin.format('YYYY'),
//       caso: caso,
//       res_celda: res_celda,
//       res_grid: res_grid,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         // debug(data)
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   } 
//   else if (hasRaster === 'true' && discardedFilterids === 'true' ) {
//     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
//     // debug(caso)

//     debug('Ra')
//     var whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
//     pool.any(queries.getFreqMapNiche.getFreqMapRaT, {
//       spid: spid,
//       N: N,
//       alpha: alpha,
//       min_occ: min_occ,
//       where_config_raster: whereVarRaster,
//       lim_inf: fecha_incio.format('YYYY'),
//       lim_sup: fecha_fin.format('YYYY'),
//       caso: caso,
//       res_celda: res_celda,
//       res_grid: res_grid,
//       discardedDeleted: discardedDeleted
//     })
//       .then(function (data) {
//         // debug(data)
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })
//   } 
//   else{
//     next()
//   }
// }


/**
 * Obtiene frecuencia score por celda para desplegar el mapa de probabilidad 
 * sin filtros
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqMapNiche(req, res, next) {
  debug('getFreqMapNiche')
  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  // var alpha       = 0.01
  // var res_celda = verb_utils.getParam(req, 'res_celda', 'cells_16km')
  // var N           = 14707; // Verificar N, que se esta contemplando

  var res_celda_sp = verb_utils.getParam(req, 'res_celda_sp', 'cells_16km')
  var res_celda_snib = verb_utils.getParam(req, 'res_celda_snib', 'gridid_16km')
  var res_celda_snib_tb = verb_utils.getParam(req, 'res_celda_snib_tb', 'grid_16km_aoi')


  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 0)

  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  // debug(sfosil)
  var lb_fosil      = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  // debug(lb_fosil)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  // console.log(discardedDeleted);

  debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  var iter = verb_utils.getParam(req, 'val_process', false) === "true" ? iterations : 1
  debug("iterations: " + iter)

   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  filter_time = false;

  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""

  debug("idtabla: " + idtabla)


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

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    // res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    // debug('res_celda: ' + res_celda)


    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMap, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      where_config_raster: whereVarRaster,
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
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

     var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

    res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    debug('res_celda: ' + res_celda)


    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapBio, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config: whereVar,
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
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

    //  var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    // debug('caso: ' + caso)

    // filter_time = caso !== -1 ? true : filter_time
    // debug('filter_time: ' + filter_time)

    // res_celda = caso !== -1 || lb_fosil.length > 1 ? res_celda.replace("cells","gridid") : res_celda
    // debug('res_celda: ' + res_celda)


    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    // debug(whereVarRaster)

    pool.any(queries.getFreqMapNiche.getFreqMapRaster, {
      iterations: iter,
      spid: spid,
      N: N,
      alpha: alpha,
      min_occ: min_occ,
      fossil: lb_fosil,
      where_config_raster: whereVarRaster,
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla
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
 * Esta variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getFreqMapNiche. Actualmente el flujo es getFreqMapNiche_M,
 * getFreqMapNiche_A, getFreqMapNiche_T y getFreqMapNiche.
 *
 * @see controllers/getFreqMapNiche~getFreqMapNiche_M
 * @see controllers/getFreqMapNiche~getFreqMapNiche_A
 * @see controllers/getFreqMapNiche~getFreqMapNiche_T
 * @see controllers/getFreqMapNiche~getFreqMapNiche
 */
exports.pipe = [
  // getFreqMap_TM,
  // getFreqMap_TA,
  getFreqMapNiche_M,
  getFreqMapNiche_A,
  // getFreqMapNiche_T,
  getFreqMapNiche    
]
