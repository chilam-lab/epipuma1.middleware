/**
* En este módulo se implementan utilidades comunes para todos los verbos
*
* @exports controllers/verb_utils
* @requires debug
* @requires moment
*/
var verb_utils = {} 

var debug = require('debug')('verbs:verbsUtils')
var moment = require('moment')
var pgp = require('pg-promise')()
var config = require('../config')
var crossfilter = require('crossfilter')
var d3 = require('d3')
// var pool= pgp(config.db)

/**
 * Pool de conexiones a la base de datos
 */
verb_utils.pool = pgp(config.db)

/**
 * Definición del número de celdas en la malla
 */
verb_utils.N = 0 // Deprecated: Ahora se obtiene la cuenta del store en tiempo de ejecución dependiendo de la resolución enviada
verb_utils.iterations = 5 // Iteraciones realizadas en proceso de validación
verb_utils.alpha = 1/10000 // Deprecated: Ahora se obtiene el valor dentro del store en tiempo de ejecución dependiendo de la resolución enviada
verb_utils.maxscore = 700 // Valor para realizar el calculo de probabilidad de epsilon
verb_utils.limite = 15 // numero de elemntos mostrados en autocomplete de especie
verb_utils.min_taxon_name = 'especievalidabusqueda' // nombre de columna del valor minimo taxonomico en base de datos
verb_utils.max_taxon_name = 'reinovalido' // nombre de columna del valor maximo taxonomico en base de datos
buckets = 20



/**
 * Regresa el valor del parametro `name` cuando este presente o
 * `defaultValue`. Verifica los valores en el cuerpo de la petición, {"id":12}, 
 * y en el query, ej. ?id=12. Se utiliza `BodyParser`.
 *
 * @param {express.Request} req - Express request object
 * @param {string} name - Parameter name
 * @param {Mixed} [defaultValue] - Returned default value if paramters is not 
 * defined
 * @return {string}
 *
 */
verb_utils.getParam = function (req, name, defaultValue) {
  var body = req.body || {}
  var query = req.query || {}

  if (body[name] != null) return body[name]
  if (query[name] != null) return query[name]

  return defaultValue
}


/**
 * Procesa los valores de `tfilters_total` para crear el filtro de estos. Solo
 * se consideran los filtros bióticos.
 *
 * @param {array} tfilters_total - Express request object
 * @param {integer} [spid] - Specie identifier 
 * @returns {string} Raw SQL statement to filter
 */
verb_utils.processBioFilters = function(tfilters_total, spid){
  var whereVar = ''
  var first_bio = true
  var tfilters = []

  for (var i = 0; i < tfilters_total.length; i++) {
    if(tfilters_total[i].type == 4) {
      tfilters.push(tfilters_total[i])
    }
  }

  var filter_disj = ''
  if(spid) {
    // spid esta presente en la tabla snib y sp_snib
    filter_disj = 'spid <> ' + spid + ' and '
  }

  for (var i = 0; i < tfilters.length; i++) {
    if (first_bio == true) {
	// si existe mas de un elemento deben ir entre parentesis, ej: 
        // and (familiavalida = 'Felidae' or familiavalida = 'Canidae')
      if(tfilters.length > 1) {
        whereVar = whereVar + ' where ' + filter_disj + ' (' + 
              tfilters[i].field + ' = \'' + tfilters[i].value + '\''
      } else {
        whereVar = whereVar + ' where ' + filter_disj + tfilters[i].field + 
              ' = \'' + tfilters[i].value + '\''	
      }
      first_bio = false
    } else {
      whereVar = whereVar + ' OR ' + tfilters[i].field + ' = \'' + 
            tfilters[i].value + '\' '
    }
  }
		
  // si existe mas de un elemento deben ir entre parentesis, ej: 
    // and (familiavalida = 'Felidae' or familiavalida = 'Canidae')
  if(tfilters.length > 1) {
    whereVar = whereVar + ') '
  }

  return whereVar
}


/**
 * Procesa los valores de `tfilters_total` para crear el filtro de estos. Solo
 * se consideran los filtros abióticos.
 *
 * @param {array} tfilters_total - Express request object
 * @returns {string} Raw SQL statement to filter
 */
verb_utils.processRasterFilters = function(tfilters_total){
  var whereVar = ''
  var first_other = true
  var tfilters = []

  for (var i = 0; i < tfilters_total.length; i++) {
    if(tfilters_total[i].type != 4) {
      tfilters.push(tfilters_total[i])
    }
  }

  for (var i = 0; i < tfilters.length; i++) {
    if(tfilters[i].level == 0) {
      if (first_other == true) {
        if(tfilters[i].type == 5) {
          whereVar = whereVar + ' where type <> 0 '
        } else {
          whereVar = whereVar + ' where type = ' + tfilters[i].type
        }

        first_other = false
      } else {
        if(tfilters[i].type == 5) {
          whereVar = whereVar + ' or type <> 0 '
        } else {
          whereVar = whereVar + ' or type = ' + tfilters[i].type
        }
      }
    } else if (tfilters[i].level == 1) {
      if (first_other == true) {
        whereVar = whereVar + ' where layer = \'' + tfilters[i].value + '\''
        first_other = false
      } else {
        whereVar = whereVar + ' OR layer = \'' + tfilters[i].value + '\''
      }
    } else {
      if (first_other == true){
        whereVar = whereVar + ' where bid = \'' + tfilters[i].value + '\''
        first_other = false
      } else {
        whereVar = whereVar + ' OR bid = \'' + tfilters[i].value + '\''
      }
    }
  }

  return whereVar
}


/**
 * Se genera el filtro necesario para hacer consultas temporales 
 *
 * @param {string} lim_inf - Date string in format YYYY-MM-DD
 * @param {string} lim_sup - Date string in format YYYY-MM-DD
 * @param {boolean} sfecha - Indicates if the registers without dates are 
 * considered
 * @returns {string} Raw SQL statement to filter
 */
verb_utils.processDateRecords = function(lim_inf, lim_sup, sfecha){
  var filterDates = ''
  // debug(lim_inf);
  // debug(lim_sup);
  // debug(sfecha);

  if(lim_inf || sfecha === 'false') {
    filterDates += 'where (snib.especievalidabusqueda = \'\' or ' + 
          'snib.especievalidabusqueda is null)  or '
    if(lim_inf) {
      filterDates +=  '(( EXTRACT( EPOCH FROM to_timestamp(fechacolecta, ' + 
            '\'YYYY-MM--DD\') ) * 1000 ) < ' + lim_inf + ' ' +
            'or ' + '(EXTRACT(EPOCH FROM to_timestamp(fechacolecta, ' + 
            '\'YYYY-MM--DD\')) * 1000) > ' + lim_sup + ' ) '
      if(sfecha === 'false') {
	// debug("Filtros y sin fecha");
	// los valores nulos y vacios de fechacolecta son menores al valor 
        // establecido en la condicion de tiempo anteior 
      } else {
	// debug("Solo filtros");
        filterDates += ' and (fechacolecta <> \'\' and ' + 
              'fechacolecta is not null)  '
      }
    }
    if(lim_inf == undefined && sfecha === 'false') {
        // debug("Solo registros sin fecha");
      filterDates += ' (fechacolecta = \'\' or fechacolecta is null) '
    }
  }

	// debug(filterDates);

  return filterDates
}


/**
 * Se genera el filtro necesario para hacer consultas temporales 
 *
 * @param {integer} groupid - Code for Biotic, Abiotic, Topographic 
 * variables 
 * @param {integer} tfilters - 
 * @returns {Object} 
 */
verb_utils.processTitleGroup = function(groupid, tfilters){

  var title_valor = ''

  if(groupid != undefined) {
    // group_item = 0 ->> root
    if (tfilters[0].type == 4) {
      title_valor = JSON.stringify(
        {'title':'Grupo Bio ' + groupid, 
          'type': tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent':true })
    } else if (tfilters[0].type == 0) {
      title_valor = JSON.stringify(
        {'title':'Grupo Abio ' + groupid, 
          'type': tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent':true })
	// title_valor = "Grupo Abio " + groupid;
    } else { // if (tfilters[0].type == 1){
      title_valor = JSON.stringify(
        {'title':'Grupo Topo ' + groupid, 
          'type': tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent':true })
	// title_valor = "Grupo Abio " + groupid;
    }
  } else if (tfilters[0].value) {
    // debug("title: " + tfilters[0].value);
    // debug("title: " + tfilters[0].label);
    // debug(group_item);
    if (tfilters[0].type == 4) {
      title_valor = JSON.stringify(
        {'title':tfilters[0].value, 
          'type':tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent':false })
    } else {
      title_valor = JSON.stringify(
        {'title':tfilters[0].label, 
          'type':tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent':false })
    }
  }
		
  // debug("title_valor: " + title_valor);
  return JSON.parse(title_valor)
}


/**
 * Se genera el filtro necesario para hacer consultas temporales 
 *
 * @param {boolean} issource - True if it is specie
 * @param {string} nivel - Taxonomic level 
 * @returns {string} Raw SQL column names 
 */
verb_utils.getColumns = function(issource, nivel) {
  if(issource == 1) {
    return 'spid, reinovalido, phylumdivisionvalido, clasevalida, ' + 
          'ordenvalido, familiavalida, generovalido, especievalidabusqueda'
  } else {
    return 'distinct ' + nivel + ' '
  }
}


/**
 * Se genera el filtro necesario para hacer consultas temporales 
 *
 * @param {string} fecha_incio - 
 * @param {string} fecha_fin - 
 * @param {boolean} sfecha - True if the registries without date are consider  
 * @returns {integer} Temporal filter code 
 */
verb_utils.getTimeCase = function(fecha_incio, fecha_fin, sfecha){
  // debug(fecha_incio.format('YYYY'));
  // debug(fecha_fin.format('YYYY'));
  // debug(sfecha);

  var caso = -1

  if( (parseInt(fecha_incio.format('YYYY')) != 1500 || 
       parseInt(fecha_fin.format('YYYY')) != 
       parseInt(moment().format('YYYY')) ) && sfecha === 'false') {
    debug('rango y sin fecha')
    caso = 2
  } else if( parseInt(fecha_incio.format('YYYY')) == 1500 && 
             parseInt(fecha_fin.format('YYYY')) == 
             parseInt(moment().format('YYYY'))  && sfecha === 'false') {
    debug('solo sin fecha')
    caso = 1
  } else if( parseInt(fecha_incio.format('YYYY')) != 1500 || 
             parseInt(fecha_fin.format('YYYY')) != 
             parseInt(moment().format('YYYY')) ) {
    debug('solo rango')
    caso = 3
  }
  
  // debug(caso);
  return caso

}


/**
 * Se genera el filtro necesario para hacer consultas temporales 
 *
 * @param {array} tfilters_total - Array with filters 
 * @returns {string} Raw SQL columns names 
 */
verb_utils.getRasterCategories = function(tfilters_total) {
  var categorias = ''
  var abio = false, topo = false, suelo = false, bio = false

  for (var i = 0; i < tfilters_total.length; i++) {
    if(tfilters_total[i].type == 4 && bio==false) {
      if(i>0) 
        categorias += '||'
      categorias += 'animalia||plantae||fungi||protoctista||prokaryotae'
      bio = true
    }	else if(tfilters_total[i].type == 0 && abio==false) {
      if(i>0) 
        categorias += '||'
      categorias += 'bio1||bio2||bio3||bio4||bio5||bio6||bio7||bio8' +
            '||bio9||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17'+
            '||bio18||bio19'
      abio = true
    } else if(tfilters_total[i].type == 2 && topo==false) {
      if(i>0) 
        categorias += '||'
      categorias += 'elevacion||pendiente||topidx'
      topo = true
    } else if(tfilters_total[i].type == 1 && suelo==false) {
      if(i>0) 
        categorias += '||'
      categorias += 'mexca || mexce || mexco || mexk || mexmg || mexmo || ' + 
            'mexna || mexph || mexras'
      suelo = true
    }
  }

	// debug(categorias);
  return categorias
}


verb_utils.getRequestParams = function(req, verbose){

  debug("getRequestParams")

  var data_request = {};

  data_request["spid"] = parseInt(verb_utils.getParam(req, 'id'))
  var tfilters = verb_utils.getParam(req, 'tfilters')
  
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  data_request["res_celda_sp"] = "cells_"+grid_resolution+"km" 
  data_request["res_celda_snib"] = "gridid_"+grid_resolution+"km" 
  data_request["res_celda_snib_tb"] = "grid_"+grid_resolution+"km_aoi" 


  //Parametros posibes: full | species_coverage
  data_request["n_grid_coverage"] = verb_utils.getParam(req, 'n_grid_coverage', "full")


  // filtros por tiempo
  var fini = moment(verb_utils.getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var ffin = moment(verb_utils.getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  
  data_request["sfecha"] = verb_utils.getParam(req, 'sfecha', false)
  data_request["lim_inf"] = fini.format('YYYY')
  data_request["lim_sup"] = ffin.format('YYYY')


  // registros fosiles
  var sfosil = verb_utils.getParam(req, 'fossil', false)
  data_request["fossil"] = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : ""


  // proceso de validación
  var val_process = verb_utils.getParam(req, 'val_process', false)
  data_request["iterations"] = val_process === "true" ? verb_utils.iterations : 1


  var idtabla = verb_utils.getParam(req, 'idtabla')
  data_request["idtabla"] = data_request.iterations > 1 ? idtabla : ""


  // Siempre incluidos en query, nj >= 0
  data_request["min_occ"] = verb_utils.getParam(req, 'min_occ', 1)


  // variables bioticas, raster y apriori
  data_request["hasBios"] = verb_utils.getParam(req, 'hasBios')
  data_request["hasRaster"] = verb_utils.getParam(req, 'hasRaster')
  data_request["apriori"] = verb_utils.getParam(req, 'apriori')


  var groupid = verb_utils.getParam(req, 'groupid')
  if(groupid != undefined || tfilters != undefined){
    data_request["title_valor"] = verb_utils.processTitleGroup(groupid, tfilters)  
  }


  data_request["discardedDeleted"] = verb_utils.getParam(req, 'discardedFilterids',[])
  data_request["caso"] = verb_utils.getTimeCase(fini, ffin, data_request.sfecha)
  data_request["filter_time"] = data_request.caso !== -1 ? true : false

  if (data_request.hasBios === 'true' ) {
    data_request["where_config"] = verb_utils.processBioFilters(tfilters, data_request.spid)
  }

  if (data_request.hasRaster === 'true' ) {
    data_request["where_config_raster"] = verb_utils.processRasterFilters(tfilters)
  }


  data_request["alpha"] = verb_utils.alpha
  

  if(verbose){
    debug(data_request)
  }


  return data_request;

}


verb_utils.processDataForScoreDecil = function (data_cell){

  var decile = 10
  var delta = Math.floor(data_cell.length/decile)

  // debug(data_cell.length)
  // debug(delta)
  
  data_cell.reverse()
  data_cell.forEach(function (item, index){
      var dec = Math.floor(index/delta)+1
      item["decile"] = dec > decile ? decile : dec
  })
  data_cell.reverse()

  var cross_score = crossfilter(data_cell)
  cross_score.groupAll()

  var scr_dimension = cross_score.dimension(function(d) { return d.decile });

  var groupByScoreCell = scr_dimension.group().reduce(
    function(item,add){
      item.val = item.val + 1
      item.sum = item.sum + add.tscore
      item.min = item.min < add.tscore ? item.min : add.tscore
      item.max = item.max > add.tscore ? item.max : add.tscore
      return item
    },
    function(item,remove){
      item.val = item.val - 1
      item.sum = item.sum - remove.tscore
      item.min = item.min < add.tscore ? item.min : add.tscore
      item.max = item.max > add.tscore ? item.max : add.tscore
      return item
    },
    function(){
      return {
        val: 0,
        sum: 0,
        min: Number.MAX_VALUE,
        max: Number.MIN_VALUE
      }
    }
  )

  var score_cell_decil = groupByScoreCell.top(Infinity);
  score_cell_decil.sort(verb_utils.compare_desc)
  // debug(score_cell_decil)

  var cell_decil_array = []
  for(var i=0; i<score_cell_decil.length; i++){
      const entry = score_cell_decil[i];
      cell_decil_array.push({
        decil: entry["key"], 
        avg: parseFloat((entry["value"].sum/entry["value"].val).toFixed(3)),
        l_sup: entry["value"].max,
        l_inf: entry["value"].min,
        vp: 0,
        fn: 0,
        nulos: 0,
        recall: 0
      })
  }

  // debug(cell_decil_array)
  
  return cell_decil_array;


}


verb_utils.processDataForScoreCell = function (data){

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


verb_utils.processDataForFreqCell = function (data){


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
  score_cell_data.sort(verb_utils.compare);

  var data_freq = [];

  data_freq = verb_utils.generateFrequencyBeans(score_cell_data, scrRange, "",  data_freq, buckets);
  // debug(data_freq)

  return data_freq;
  

}


verb_utils.processDataForFreqSpecie = function (data){

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
  data_eps.sort(verb_utils.compare);
  // debug(data_eps);

  var data_scr = groupByScore.top(Infinity);
  data_scr.sort(verb_utils.compare);
  // debug(data_scr);

  var data_freq = [];

  data_freq = verb_utils.generateFrequencyBeans(data_eps, epsRange, "_epsilon",  data_freq, buckets);
  data_freq = verb_utils.generateFrequencyBeans(data_scr, scrRange, "_score",  data_freq, buckets);

  // debug(data_freq);

  return data_freq;
}


verb_utils.generateFrequencyBeans = function (data_bucket, funcRange, paramType, data_freq, buckets ){

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

verb_utils.compare = function (a,b) {
  if (a.key < b.key)
    return -1;
  if (a.key > b.key)
    return 1;
  return 0;
}

verb_utils.compare_desc = function (a,b) {
  if (a.key > b.key)
    return -1;
  if (a.key < b.key)
    return 1;
  return 0;
}

verb_utils.getMinY = function (data,value) {
  return data.reduce((min, p) => parseFloat(p[value])  < parseFloat(min) ? parseFloat(p[value]) : parseFloat(min), parseFloat(data[0][value]));
}

verb_utils.getMaxY = function (data,value) {
  return data.reduce((max, p) => parseFloat(p[value]) > parseFloat(max) ? parseFloat(p[value]) : parseFloat(max), parseFloat(data[0][value]));
}




module.exports = verb_utils
