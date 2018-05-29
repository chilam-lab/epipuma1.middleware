/**
* Este verbo regresa la frecuencia del score por celda para poder desplegar el
* mapa de probabilidad
*
* @module controllers/getCellScoreNiche
* @requires debug
* @requires pg-promise
* @requires moment
* @requires config
* @requires module:controllers/verb_utils
* @requires module:controllers/sql/queryProvider
*/
var debug = require('debug')('verbs:getCellScoreNiche')
var moment = require('moment')

var verb_utils = require('./verb_utils')
var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha
var maxscore = verb_utils.maxscore


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

  var filter_time = false

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')

  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  'cells_'+grid_resolution+'km'   
  var res_celda_snib =  'gridid_'+grid_resolution+'km' 
  var res_celda_snib_tb = 'grid_'+grid_resolution+'km_aoi' 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', 'full')
  
  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var mapa_prob       = verb_utils.getParam(req, 'mapa_prob')
  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  var lb_fosil      = sfosil === 'false' || sfosil === false ? ' and (ejemplarfosil <> \'SI\' or ejemplarfosil is null) ' : ''
  
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  var iter = verb_utils.getParam(req, 'val_process', false) === 'true' ? iterations : 1
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ''
  
   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')

  // debug("n_grid_coverage: " + n_grid_coverage)
  // debug("idtabla: " + idtabla)
  // debug("iterations: " + iter)
  // debug("val_ process: " + verb_utils.getParam(req, 'val_process', false))
  // debug(lb_fosil)
    
  if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){
    debug('TM')
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

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
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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

  var filter_time = false

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  'cells_'+grid_resolution+'km'   
  var res_celda_snib =  'gridid_'+grid_resolution+'km' 
  var res_celda_snib_tb = 'grid_'+grid_resolution+'km_aoi' 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', 'full')
  
  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)
  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  var lb_fosil      = sfosil === 'false' || sfosil === false ? ' and (ejemplarfosil <> \'SI\' or ejemplarfosil is null) ' : ''

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var apriori         = verb_utils.getParam(req, 'apriori')

  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  
  var iter = verb_utils.getParam(req, 'val_process', false) === 'true' ? iterations : 1
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ''

   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  // debug("n_grid_coverage: " + n_grid_coverage)
  // debug("iterations: " + iter)
  // debug("idtabla: " + idtabla)
  // debug(lb_fosil)
  // debug(sfosil)
    
  if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ) {
    debug('TA')
    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

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
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb, 
      discardedDeleted: discardedDeleted,
      lim_inf: fecha_incio.format('YYYY'),
      lim_sup: fecha_fin.format('YYYY'),
      caso: caso,
      filter_time: filter_time,
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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

    var whereVar = verb_utils.processBioFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapBioA, {
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
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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

    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

    pool.any(queries.getFreqMapNiche.getFreqMapRaA, {
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
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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
 * sin filtros
 *
 * @function
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object 
 * @param {function} next - Express next middleware function
 */
function getFreqMapNiche(req, res, next) {
  
  debug('getFreqMapNiche')

  var filter_time = false

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  'cells_'+grid_resolution+'km'   
  var res_celda_snib =  'gridid_'+grid_resolution+'km' 
  var res_celda_snib_tb = 'grid_'+grid_resolution+'km_aoi' 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', 'full')
  
  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)
  var sfosil        = verb_utils.getParam(req, 'fossil', false)
  var lb_fosil      = sfosil === 'false' || sfosil === false ? ' and (ejemplarfosil <> \'SI\' or ejemplarfosil is null) ' : ''

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])
  var iter = verb_utils.getParam(req, 'val_process', false) === 'true' ? iterations : 1

   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  
  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ''

  
  // debug("idtabla: " + idtabla)
  // debug("iterations: " + iter)
  // debug("n_grid_coverage: " + n_grid_coverage)
  // debug("res_celda_sp: " + res_celda_sp)
  // debug(sfosil)
  // debug(lb_fosil)
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

    var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso)

    filter_time = caso !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)

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
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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
      idtabla: idtabla,
      n_grid_coverage: n_grid_coverage
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
    debug('getCellScore endpoint listening')

    res.json(
      { 
        message: 'getCellScore endpoint listening, please add the minimum parameters to get a response. See the example parameter',
        example: {
          id: 27332,
          idtime: '1519077493248',
          min_occ: 1,
          fossil: 'true',
          sfecha: 'true',
          val_process: 'false',
          idtabla: 'no_table',
          grid_res: '16',
          tfilters: [{
            field: 'clasevalida',
            value: 'Mammalia',
            type: 4
          }],
          hasBios: 'true',
          hasRaster: 'false'
        }
      }
    )
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
