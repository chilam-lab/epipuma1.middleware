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
var crossfilter = require('crossfilter')
var d3 = require('d3')

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

  var filter_time = false;

  var spid        = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters    = verb_utils.getParam(req, 'tfilters')
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  "cells_"+grid_resolution+"km"   
  var res_celda_snib =  "gridid_"+grid_resolution+"km" 
  var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 

  //Parametros posibes: full | species_coverage
  var n_grid_coverage = verb_utils.getParam(req, 'n_grid_coverage', "full")
  
   // filtros por tiempo
  var sfecha            = verb_utils.getParam(req, 'sfecha', false)
  var fecha_incio       = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin         = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var sfosil            = verb_utils.getParam(req, 'fossil', false)

  var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
  var val_process = verb_utils.getParam(req, 'val_process', false)
  var iter =  val_process === "true" ? iterations : 1

  var idtabla = verb_utils.getParam(req, 'idtabla')
  idtabla = iter > 1 ? idtabla : ""
  
  // Siempre incluidos en query, nj >= 0
  var min_occ       = verb_utils.getParam(req, 'min_occ', 1)

  // variables configurables
  var hasBios         = verb_utils.getParam(req, 'hasBios')
  var hasRaster       = verb_utils.getParam(req, 'hasRaster')
  var apriori         = verb_utils.getParam(req, 'apriori')

  var groupid        = verb_utils.getParam(req, 'groupid')
  if(groupid != undefined || tfilters != undefined){
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters)  
  }
  
  var discardedDeleted = verb_utils.getParam(req, 'discardedFilterids',[])

  debug("lb_fosil: " + lb_fosil)




  
  if (hasBios === 'true' && hasRaster === 'false' ) {

    debug('Caso: hasBios:true - hasRaster:false')

    var caso_filtro_temporal = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso_filtro_temporal)


    var filter_time = caso_filtro_temporal !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)


    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    debug('whereVar: ' + whereVar)
    

    // Inica tarea
    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            res_celda_snib_tb: res_celda_snib_tb

        }).then(resp => {

            debug("N:" + resp.n)

            // seleccion de caso para obtener datos de especie ibjetivo
            if(caso_filtro_temporal === -1 && lb_fosil.length == 0){
              debug("counts case 1: basico")
              // query_source = queries.basicAnalysis.getSource  
              query = queries.basicAnalysis.getCountsBio
            }
            else if(caso_filtro_temporal === -1 && lb_fosil.length > 1){
              debug("counts case 2: sin fosil")
              // query = queries.basicAnalysis.getSourceFossil
              query = queries.basicAnalysis.getCountsBioFossil
            }
            else{
              debug("counts case 3: tiempo y posible fosil")
              // query = queries.basicAnalysis.getSourceTime  
              query = queries.basicAnalysis.getCountsBioTime
            }

            return t.any(query, {
              spid: spid,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              min_occ: min_occ,
              N: resp.n,
              alpha: alpha,
              caso: caso_filtro_temporal,
              lim_inf: fecha_incio.format('YYYY'),
              lim_sup: fecha_fin.format('YYYY'),
              fosil: lb_fosil,
              whereVar: whereVar
            })

          })

    })
    .then(data => {

        var data_freq = processDataForFreqSpecie(data)
        var data_score_cell = processDataForScoreCell(data);
        var data_freq_cell = processDataForFreqCell(data_score_cell);

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
  else if (hasBios === 'false' && hasRaster === 'true' ) {

    debug('Caso: hasBios:false - hasRaster:true')

    var caso_filtro_temporal = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso_filtro_temporal)


    var filter_time = caso_filtro_temporal !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)


    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    debug('whereVarRaster: ' + whereVarRaster)
    

    // Inica tarea
    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            res_celda_snib_tb: res_celda_snib_tb

        }).then(resp => {

            debug("N:" + resp.n)

            // seleccion de caso para obtener datos de especie ibjetivo
            if(caso_filtro_temporal === -1 && lb_fosil.length == 0){
              debug("counts case 1: basico")
              query = queries.basicAnalysis.getCountsAbio
            }
            else{
              debug("counts case 2: fossil - time")
              query = queries.basicAnalysis.getCountsAbioFossilTime
            }


            return t.any(query, {
              spid: spid,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              min_occ: min_occ,
              N: resp.n,
              alpha: alpha,
              caso: caso_filtro_temporal,
              lim_inf: fecha_incio.format('YYYY'),
              lim_sup: fecha_fin.format('YYYY'),
              fosil: lb_fosil,
              whereVar: whereVarRaster
            })

          })
        

    })
    .then(data => {

        var data_freq = processDataForFreqSpecie(data)

        res.json({
          ok: true,
          usuarioRequest: req.usuarioRequest,
          data: data,
          data_freq: data_freq
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
  else if (hasBios === 'true' && hasRaster === 'true' ) {

    debug('Caso: hasBios:true - hasRaster:true')

    var caso_filtro_temporal = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
    debug('caso: ' + caso_filtro_temporal)


    var filter_time = caso_filtro_temporal !== -1 ? true : filter_time
    debug('filter_time: ' + filter_time)


    var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
    debug('whereVarRaster: ' + whereVarRaster)


    var whereVar = verb_utils.processBioFilters(tfilters, spid)
    debug('whereVar: ' + whereVar)


    pool.task(t => {

        return t.one(queries.basicAnalysis.getN, {

            res_celda_snib_tb: res_celda_snib_tb

        }).then(resp => {

            debug("N:" + resp.n)

            // seleccion de caso para obtener datos de especie ibjetivo
            if(caso_filtro_temporal === -1 && lb_fosil.length == 0){
              debug("counts case 1: basico")
              query = queries.basicAnalysis.getCounts
            }
            else if(caso_filtro_temporal === -1 && lb_fosil.length > 1){
              debug("counts case 2: sin fosil")
              // query = queries.basicAnalysis.getSourceFossil
              query = queries.basicAnalysis.getCountsFossil
            }
            else{
              debug("counts case 3: tiempo y posible fosil")
              // query = queries.basicAnalysis.getSourceTime  
              query = queries.basicAnalysis.getCountsTime
            }

            return t.any(query, {
              spid: spid,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              min_occ: min_occ,
              N: resp.n,
              alpha: alpha,
              caso: caso_filtro_temporal,
              lim_inf: fecha_incio.format('YYYY'),
              lim_sup: fecha_fin.format('YYYY'),
              fosil: lb_fosil,
              whereVar: whereVar,
              whereVarRaster: whereVarRaster
            })

          })
        

    })
    .then(data => {

        var data_freq = processDataForFreqSpecie(data)

        res.json({
          ok: true,
          usuarioRequest: req.usuarioRequest,
          data: data,
          data_freq: data_freq
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



function processDataForScoreCell(data){

  var cells_array = data.map(function(d) {return {cells: d.cells, score: parseFloat(d.score)}})

  var cells = []
  cells_array.forEach(function (item, index){
    item.cells.forEach(function (cell_item, index){
          cells.push({cell: cell_item, score: item.score})
    })
  })
  // debug(cells)

  var cross_cells = crossfilter(cells)
  cross_cells.groupAll();

  var cells_dimension = cross_cells.dimension(function(d) { return d.cell; });
  var groupByCell = cells_dimension.group().reduceSum(function(d) { return parseFloat(parseFloat(d.score).toFixed(3)); });
  var map_cell = groupByCell.top(Infinity);

  // debug(map_cell)

 var cell_score_array = [];
 for(var i=0; i<map_cell.length; i++){
      const entry = map_cell[i];
      cell_score_array.push({gridid: entry["key"], tscore: parseFloat(entry["value"].toFixed(3))})
  }

  var data_freq = [];

  // debug(cell_score_array)
  return cell_score_array

}



function processDataForFreqCell(data){


  var min_scr = d3.min(data.map(function(d) {return parseFloat(d.tscore);}));
  // debug("min_score: " + min_scr)
  var max_scr = d3.max(data.map(function(d) {return parseFloat(d.tscore);}));
  // debug("min_score: " + max_scr)

  var beans = d3.range(1,buckets+1,1);
  var scrRange = d3.scaleQuantile().domain([min_scr, max_scr]).range(beans);

  var cross_score = crossfilter(data)
  cross_score.groupAll();

  var scr_dimension = cross_score.dimension(function(d) { return parseFloat(d.tscore); });

  var groupByScoreCell = scr_dimension.group(function(d){
    return scrRange(d)
  });

  var score_cell_data = groupByScoreCell.top(Infinity);
  score_cell_data.sort(compare);

  var data_freq = [];

  data_freq = generateFrequencyBeans(score_cell_data, scrRange, "",  data_freq, buckets);
  // debug(data_freq)

  return data_freq;
  

}


function processDataForFreqSpecie(data){

  var min_eps = d3.min(data.map(function(d) {return parseFloat(d.epsilon);}));
  // debug("min_eps: " + min_eps)
  var max_eps = d3.max(data.map(function(d) {return parseFloat(d.epsilon);}));
  // debug("max_eps: " + max_eps)

  var min_scr = d3.min(data.map(function(d) {return parseFloat(d.score);}));
  // debug("min_scr: " + min_scr)  
  var max_scr = d3.max(data.map(function(d) {return parseFloat(d.score);}));
  // debug("max_scr: " + max_scr)


  var beans = d3.range(1,buckets+1,1);
  var epsRange = d3.scaleQuantile().domain([min_eps, max_eps]).range(beans);
  var scrRange = d3.scaleQuantile().domain([min_scr, max_scr]).range(beans);
  // debug("epsRange: " + epsRange.invertExtent(1))
  
  var cross_species = crossfilter(data)
  cross_species.groupAll();

  var eps_dimension = cross_species.dimension(function(d) { return parseFloat(d.epsilon); });
  var scr_dimension = cross_species.dimension(function(d) { return parseFloat(d.score); });

  var groupByEpsilon = eps_dimension.group(function(d){
    // debug("epsRange: " + epsRange(d))
    return epsRange(d)
  });

  var groupByScore = scr_dimension.group(function(d){
    return scrRange(d)
  });

  var data_eps = groupByEpsilon.top(Infinity);
  data_eps.sort(compare);
  // debug(data_eps);

  var data_scr = groupByScore.top(Infinity);
  data_scr.sort(compare);
  // debug(data_scr);

  var data_freq = [];

  data_freq = generateFrequencyBeans(data_eps, epsRange, "_epsilon",  data_freq, buckets);
  data_freq = generateFrequencyBeans(data_scr, scrRange, "_score",  data_freq, buckets);

  // debug(data_freq);

  return data_freq;
}


function generateFrequencyBeans(data_bucket, funcRange, paramType, data_freq, buckets ){

  var index = 0;
  var index_bucket = 0;
  
  while(index_bucket<buckets){

      const entry = data_bucket[index];
      
      var bucket = entry["key"];
      var freq = entry["value"];
      var range = funcRange.invertExtent((index_bucket+1));

      // debug("freq" + paramType+ ": " + freq);
      // debug("bucket" + paramType+ ": " + bucket);
      // debug("index+1" + paramType+ ": " + (index_bucket+1));

      if((index_bucket+1) === bucket){

        if(data_freq[index_bucket] === undefined){

          var item = {};

          item["bucket"] = bucket;
          item["freq"+paramType] = freq;
          item["min"+paramType] = parseFloat((range[0]).toFixed(3));
          item["max"+paramType] = parseFloat((range[1]).toFixed(3));
          data_freq.push(item);

        }
        else{
          data_freq[index_bucket]["freq"+paramType] = freq;
          data_freq[index_bucket]["min"+paramType] = parseFloat(range[0].toFixed(3));
          data_freq[index_bucket]["max"+paramType] = parseFloat(range[1].toFixed(3));
        }        

        index++;
      }
      else{

        if(data_freq[index_bucket] === undefined){

          var item = {};

          item["bucket"] = index_bucket+1;
          item["freq"+paramType] = 0;
          item["min"+paramType] = parseFloat((range[0]).toFixed(3));
          item["max"+paramType] = parseFloat((range[1]).toFixed(3));
          data_freq.push(item);

        }
        else{
          data_freq[index_bucket]["freq"+paramType] = 0;
          data_freq[index_bucket]["min"+paramType] = parseFloat(range[0].toFixed(3));
          data_freq[index_bucket]["max"+paramType] = parseFloat(range[1].toFixed(3));
        }        

      }
      
      index_bucket++;
  }

  return data_freq;
}

function compare(a,b) {
  if (a.key < b.key)
    return -1;
  if (a.key > b.key)
    return 1;
  return 0;
}


function getMinY(data,value) {
  return data.reduce((min, p) => parseFloat(p[value])  < parseFloat(min) ? parseFloat(p[value]) : parseFloat(min), parseFloat(data[0][value]));
}

function getMaxY(data,value) {
  return data.reduce((max, p) => parseFloat(p[value]) > parseFloat(max) ? parseFloat(p[value]) : parseFloat(max), parseFloat(data[0][value]));
}



