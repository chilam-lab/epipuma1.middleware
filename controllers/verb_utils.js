/**
* En este módulo se implementan utilidades comunes para todos los verbos
*
* @exports controllers/verb_utils
* @requires debug
* @requires moment
*/
var verb_utils = {} 

var debug = require('debug')('verbs:verb_utils')
var moment = require('moment')
var pgp = require('pg-promise')()
var config = require('../config')
var crossfilter = require('crossfilter')
var d3 = require('d3')
var map_taxon = new Map()


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
verb_utils.minscore = -700
verb_utils.limite = 15 // numero de elemntos mostrados en autocomplete de especie
verb_utils.min_taxon_name = 'especieepiteto' // nombre de columna del valor minimo taxonomico en base de datos
verb_utils.max_taxon_name = 'reinovalido' // nombre de columna del valor maximo taxonomico en base de datos
buckets = 20
deciles = 10
verb_utils.region_mx = 1
verb_utils.min_occ = 5
verb_utils.type_taxon = 0

map_taxon.set("reino", "reinovalido");
map_taxon.set("kingdom", "reinovalido");
map_taxon.set("phylum", "phylumdivisionvalido");
map_taxon.set("clase", "clasevalida");
map_taxon.set("class", "clasevalida");
map_taxon.set("orden", "ordenvalido");
map_taxon.set("order", "ordenvalido");
map_taxon.set("familia", "familiavalida");
map_taxon.set("family", "familiavalida");
map_taxon.set("genero", "generovalido");
map_taxon.set("genus", "generovalido");
map_taxon.set("especie", "especievalidabusqueda");
map_taxon.set("species", "especievalidabusqueda");




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

  debug("processBioFilters")

  var whereVar = ''
  var first_bio = true
  var tfilters = []

  for (var i = 0; i < tfilters_total.length; i++) {
    if(parseInt(tfilters_total[i].type) === verb_utils.type_taxon) {
      tfilters.push(tfilters_total[i])
    }
  }

  debug(tfilters)

  var filter_disj = ''
  if(spid) {
    // spid esta presente en la tabla snib y sp_snib
    // filter_disj = 'spid <> ' + spid + ' and '
    filter_disj = 'spid not in (' + spid + ') and '
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

  // debug("bio whereVar:" + whereVar)
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

  debug("processRasterFilters")


  var whereVar = ''
  var first_other = true
  var tfilters = []

  for (var i = 0; i < tfilters_total.length; i++) {
    if( parseInt(tfilters_total[i].type) !== verb_utils.type_taxon) {
      tfilters.push(tfilters_total[i])
    }
  }

  debug(tfilters)

  for (var i = 0; i < tfilters.length; i++) {

    if(tfilters[i].level == 0) {

      // if (first_other == true) {
        // if(tfilters[i].type == 5) {
          whereVar = whereVar + ' where type <> 0 '
        // } 
        // else {
          // whereVar = whereVar + ' where type = ' + tfilters[i].type
        // }

        // first_other = false
      // } 
      // else {
        // if(tfilters[i].type == 5) {
          // whereVar = whereVar + ' or type <> 0 '
        // } 
        // else {
        //   whereVar = whereVar + ' or type = ' + tfilters[i].type
        // }
      // }

    } 

    else if (tfilters[i].level == 1) {

      if (first_other == true) {
        whereVar = whereVar + ' where type =  ' + tfilters[i].type 
        first_other = false
      } 
      else {
        whereVar = whereVar + ' or type = ' + tfilters[i].type
      }

    } 
    else if (tfilters[i].level == 2) {

      if (first_other == true) {
        whereVar = whereVar + ' where layer = \'' + tfilters[i].value + '\''
        first_other = false
      } 
      else {
        whereVar = whereVar + ' OR layer = \'' + tfilters[i].value + '\''
      }

    } 
    else {

      if (first_other == true){
        whereVar = whereVar + ' where bid = \'' + tfilters[i].value + '\''
        first_other = false
      } 
      else {
        whereVar = whereVar + ' OR bid = \'' + tfilters[i].value + '\''
      }

    }

  }

  // debug("raster whereVar:" + whereVar)
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

  debug("processTitleGroup")

  var title_valor = ''

  // debug("groupid: " + groupid)
  // debug(tfilters)

  if(groupid !== undefined) {

    debug("con groupid")

    // group_item = 0 ->> root
    if (parseInt(tfilters[0].type) === 0) {

      // debug("if (parseInt(tfilters[0].type)");


      title_valor = JSON.stringify(
        {'title':'Grupo Bio ' + groupid, 
          'type': tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent':true })
    } else { //if (tfilters[0].type != 0) {

      // debug("else ");

      title_valor = JSON.stringify(
        {'title':'Grupo Raster ' + groupid, 
          'type': tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent':true })
    } 
    // else { 
    //   title_valor = JSON.stringify(
    //     {'title':'Grupo Topo ' + groupid, 
    //       'type': tfilters[0].type , 
    //       'group_item': tfilters[0].group_item, 
    //       'is_parent':true })
    // }
  } 
  else if (tfilters[0].value) {

    debug("sin groupid")
    // debug(tfilters)

    if (parseInt(tfilters[0].type) === 0) {

      
      title_valor = JSON.stringify(
        {'title': tfilters[0].value, 
          'type': tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent': false })
    } else {

      
      title_valor = JSON.stringify(
        {'title': tfilters[0].label, 
          'type': tfilters[0].type , 
          'group_item': tfilters[0].group_item, 
          'is_parent': false })
    }
  }
		
  debug("title_valor: " + title_valor);
  return JSON.parse(title_valor)
}


/**
 * Se genera el filtro necesario para hacer consultas temporales 
 *
 * @param {boolean} issource - True if it is specie
 * @param {string} nivel - Taxonomic level 
 * @returns {string} Raw SQL column names 
 */
verb_utils.getColumns = function(issource, nivel, verbo = "getEntList") {
  if(issource === 1) {
    if(verbo === "getEntList"){
      return 'spid, reinovalido, phylumdivisionvalido, clasevalida, ' + 
          'ordenvalido, familiavalida, generovalido, especievalidabusqueda'  
    }
    else{
      return 'spid, reinovalido, phylumdivisionvalido, clasevalida, ' + 
          'ordenvalido, familiavalida'  
    }
  } else {
    if(nivel === "especieepiteto"){
      debug("nivel especieepiteto")
      
      return "distinct (generovalido || ' ' || especieepiteto) as especieepiteto"
    }  
    else{
      return 'distinct ' + nivel + ' '  
    }
    
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

  
  data_request["with_basic_data"] = verb_utils.getParam(req, 'with_basic_data', "true");
  data_request["with_data_freq"] = verb_utils.getParam(req, 'with_data_freq', "true");
  data_request["with_data_score_cell"] = verb_utils.getParam(req, 'with_data_score_cell', "true");
  data_request["with_data_freq_cell"] = verb_utils.getParam(req, 'with_data_freq_cell', "true");
  data_request["with_data_score_decil"] = verb_utils.getParam(req, 'with_data_score_decil', "true");

  // data_request["spid"] = parseInt(verb_utils.getParam(req, 'id'))
  data_request["spid"] = verb_utils.getParam(req, 'id', []).toString()
  var tfilters = verb_utils.getParam(req, 'tfilters', undefined)


  var footprint_region = parseInt(verb_utils.getParam(req, 'footprint_region', verb_utils.region_mx))
  data_request["region"] = footprint_region
  
  
  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  data_request["grid_resolution"] = grid_resolution
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
  data_request["iterations"] = val_process === true ? verb_utils.iterations : 1


  var idtabla = verb_utils.getParam(req, 'idtabla')
  data_request["idtabla"] = data_request.iterations > 1 ? idtabla : ""


  // Siempre incluidos en query, nj >= 0
  data_request["min_occ"] = verb_utils.getParam(req, 'min_occ', 1)


  // variables bioticas, raster y apriori
  var hasBios = verb_utils.getParam(req, 'hasBios') 
  data_request["hasBios"] = (hasBios === "true" || hasBios === true) ? true : false

  var hasRaster = verb_utils.getParam(req, 'hasRaster') 
  data_request["hasRaster"] = (hasRaster === "true" || hasRaster === true) ? true : false


  data_request["apriori"] = verb_utils.getParam(req, 'apriori', false) !== false ? true : false
  data_request["mapa_prob"] = verb_utils.getParam(req, 'mapa_prob', false) !== false ? true : false
  data_request["get_grid_species"] = verb_utils.getParam(req, 'get_grid_species', false)


  // debug("data_request 1")


  var groupid = verb_utils.getParam(req, 'groupid', undefined)
  debug("groupid: " + groupid)
  debug(groupid !== undefined)
  debug(tfilters !== undefined)

  if(groupid !== undefined || tfilters !== undefined){
    data_request["title_valor"] = verb_utils.processTitleGroup(groupid, tfilters)  
  }

  // debug("data_request 2")


  data_request["discardedDeleted"] = verb_utils.getParam(req, 'discardedFilterids',[])
  data_request["caso"] = verb_utils.getTimeCase(fini, ffin, data_request.sfecha)
  data_request["filter_time"] = data_request.caso !== -1 ? true : false

  debug("bios: " + data_request.hasBios)

  if ( data_request.hasBios == true ) {
    data_request["where_config"] = verb_utils.processBioFilters(tfilters, data_request.spid)
  }

  if (data_request.hasRaster == true  ) {
    data_request["where_config_raster"] = verb_utils.processRasterFilters(tfilters)
  }

  data_request["alpha"] = verb_utils.getParam(req, 'alpha', undefined) 

  if(verbose){
    debug(data_request)
  }


  return data_request;

}



// verb_utils.getRegionCountry = function(footprint_region){

//     var country = "'MEXICO'";

//     if(footprint_region == 19){
//       country = "MEXICO";
//     }
//     else if(footprint_region == 28){
//       country = "'UNITED STATES, THE'"; 
//     }
//     else if(footprint_region == 33){
//       country = "'UNITED STATES, THE'"; 
//     }
//     else{
//       country = "'MEXICO' and country = 'UNITED STATES, THE'";  
//     }

//     return country;

// }


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



verb_utils.processDataForScoreDecilTable = function (data_cell, decil_selected){

  var decile = deciles
  var delta = Math.floor(data_cell.length/decile)

  data_cell.reverse()
  data_cell.forEach(function (item, index){
      var dec = Math.floor(index/delta)+1
      item["decile"] = dec > decile ? decile : dec
  })
  data_cell.reverse()
  // debug(data_cell)

  // var cross_score = crossfilter(data_cell)
  // cross_score.groupAll()
  // var decil_dimension = cross_score.dimension(function(d) { return d.decile });
  // decil_dimension.filter(10)

  var map_spid = d3.map([]);

  data_cell.forEach(function (row_item, index){

    if(row_item.decile != decil_selected)
      return;

    row_item.species.forEach(function (specie, index){

        if(!map_spid.has(specie.spid)){
            var item = {};
            item.decile = row_item.decile,
            item.spid = specie.spid
            item.score = specie.score
            item.epsilon = specie.epsilon
            item.nj = specie.nj
            item.njd = 1
            item.name = specie.name
            map_spid.set(specie.spid, item)
        }
        else{
            var item = map_spid.get(specie.spid);
            item.njd = item.njd + 1
            map_spid.set(specie.spid, item)
        }

    })

  })

  // debug(map_spid.values());

  return map_spid.values();


}

verb_utils.processGroupDataForCellId = function (data, apriori, mapa_prob, gridid) {

  debug("processGroupDataForCellId") 
  // debug(data)
  
  var info_incell = {}
  var val_apriori = 0
  var val_mapa_prob = 0
  var groups_incell = []
  var tscore = 0
  var positives = 0
  var negatives = 0
  var bios = 0
  var raster = 0
  var hasbio = false
  var hasraster = false

  debug("apriori: " + apriori)
  debug("mapa_prob: " + mapa_prob)

  if(apriori || mapa_prob){

    val_apriori = parseFloat(Math.log(data[0].ni / (data[0].n- data[0].ni)).toFixed(2)) 
    info_incell.apriori = val_apriori

    debug("val_apriori: " + val_apriori)
  }  

  var groups = data.map(function(d) {
    if(d.cells.indexOf(gridid) !== -1){
      
      var type = d.tipo === 0 ? "bio" : "raster"

      if(type === "bio") 
        hasbio = true
      else
        hasraster = true
      
      //debug(d)
      return {
        score: parseFloat(d.score),  
        reinovalido: d.reinovalido, 
        phylumdivisionvalido: d.phylumdivisionvalido,
        clasevalida: d.clasevalida,
        ordenvalido: d.ordenvalido,
        familiavalida: d.familiavalida,
        generovalido: d.generovalido,
        especieepiteto: d.especieepiteto,
        nombreinfra: d.nombreinfra,
        type: d.type,
        layer: d.layer,
        bid: d.bid,
        icat: d.icat,
        tag: d.tag,
        tipo: type
      }
    }
  })


  groups.forEach(function (item, index){
    
    // debug(item)

    if(item){

      bios = item.reinovalido != "" ? bios+1 : bios
      raster = item.reinovalido == "" ? raster+1 : raster
      positives = item.score >= 0 ? positives+1 : positives
      negatives = item.score < 0 ? negatives+1 : negatives

      groups_incell.push({score: item.score, 
                          reinovalido: item.reinovalido, 
                          phylumdivisionvalido: item.phylumdivisionvalido,
                          clasevalida: item.clasevalida,
                          ordenvalido: item.ordenvalido,
                          familiavalida: item.familiavalida,
                          generovalido: item.generovalido,
                          especieepiteto: item.especieepiteto,
                          nombreinfra: item.nombreinfra,
                          type: item.type,
                          layer: item.layer,
                          bid: item.bid,
                          icat: item.icat,
                          tag: item.tag,
                          tipo: item.tipo
                        })
      tscore = tscore + item.score  

    }
  })

  info_incell.tscore = parseFloat((tscore).toFixed(2));
  info_incell.bios = bios;
  info_incell.raster = raster;
  info_incell.positives = positives;
  info_incell.negatives = negatives;
  info_incell.groups = groups_incell;
  info_incell.hasbio = hasbio;
  info_incell.hasraster = hasraster;

  if(mapa_prob){

    if(tscore <= verb_utils.minscore){
      tscore = 0
    }
    else if(tscore >= verb_utils.maxscore){
      tscore = 1 
    } else{
      var fscore = tscore+val_apriori
      val_mapa_prob = Math.exp(fscore) /  (1+Math.exp(fscore))
    }

    info_incell.mapa_prob = parseFloat((val_mapa_prob*100).toFixed(2))
    debug("mapa_prob: " + val_mapa_prob)
  }

  //debug(info_incell)

  return info_incell

}

verb_utils.processDataForCellId = function (data, apriori, mapa_prob, gridid){

  var info_incell = {}
  var val_apriori = 0
  var val_mapa_prob = 0
  var species_incell = []
  var tscore = 0
  var positives = 0
  var negatives = 0
  var bios = 0
  var raster = 0
  var hasbio = false
  var hasraster = false

  debug("apriori: " + apriori)
  debug("mapa_prob: " + mapa_prob)

  if(apriori || mapa_prob){
    debug("Con apriori")

    val_apriori = parseFloat(Math.log(data[0].ni / (data[0].n- data[0].ni)).toFixed(2)) 
    info_incell.apriori = val_apriori

    debug("val_apriori: " + val_apriori)
  }


  var species = data.map(function(d) {
    if(d.cells.indexOf(gridid) !== -1){
      
      var type = d.reinovalido !== "" ? "bio" : "raster"
      if(d.reinovalido !== "" || hasbio === true) hasbio = true
      if(d.reinovalido === "" || hasraster === true)  hasraster = true
      
      return {
        score: parseFloat(d.score), species: d.especievalidabusqueda, type: type
      }

    }
  })


  species.forEach(function (item, index){
    if(item){

      bios = item.type === "bio" ? bios+1 : bios
      raster = item.type === "raster" ? raster+1 : raster
      positives = item.score >= 0 ? positives+1 : positives
      negatives = item.score < 0 ? negatives+1 : negatives

      species_incell.push({name:item.species, score: item.score, type: item.type})
      tscore = tscore + item.score  

    }
  })


  info_incell.tscore = parseFloat((tscore).toFixed(2));
  info_incell.bios = bios;
  info_incell.raster = raster;
  info_incell.positives = positives;
  info_incell.negatives = negatives;
  info_incell.species = species_incell;
  info_incell.hasbio = hasbio;
  info_incell.hasraster = hasraster;



  if(mapa_prob){
    debug("Con mapa_prob")

    if(tscore <= verb_utils.minscore){
      tscore = 0
    }
    else if(tscore >= verb_utils.maxscore){
      tscore = 1 
    }
    else{
      var fscore = tscore+val_apriori
      val_mapa_prob = Math.exp(fscore) /  (1+Math.exp(fscore))
    }

    info_incell.mapa_prob = parseFloat((val_mapa_prob*100).toFixed(2))
    debug("mapa_prob: " + val_mapa_prob)
  }
  

  // debug(info_incell)
  return info_incell;


}


verb_utils.procesaTaxones = function(array_taxines){

  var where_clause = ""

  array_taxines.forEach(function (item, index){

      if(index === 0)
        where_clause += map_taxon.get(item.taxon.toLowerCase()) + " = '" + item.value + "' "
      else
        where_clause += " OR " + map_taxon.get(item.taxon.toLowerCase()) + " = '" + item.value + "' "
    
  })

  debug(where_clause)

  return where_clause



}


verb_utils.processDataForScoreCellValidation = function (data, apriori, mapa_prob, all_cells = [], isvalidation = false){

  debug("processDataForScoreCellValidation")

  var cells_array = isvalidation ? data.map(function(d) {return {cells: d.cells_map, score: parseFloat(d.score)}}) : data.map(function(d) {return {cells: d.cells, score: parseFloat(d.score)}})

  var df = d3.map([])

  cells_array.forEach(function(obj) {

    obj.cells.forEach(function(cell){

      if(df.has(cell)){
        df.set(cell, df.get(cell) + obj.score)
      } else {
        df.set(cell, obj.score)
      }

    })

  })
  training_cells = df.keys()
  scored_training_cells = []
  training_cells.forEach(function(cell) {
    scored_training_cells.push({gridid: parseInt(cell), tscore:df.get(cell)})
  })
  //debug(scored_training_cells)
  return scored_training_cells
}

verb_utils.processDataForScoreCell = function (data, apriori, mapa_prob, all_cells = [], isvalidation = false){

  debug("processDataForScoreCell")
  // debug("isvalidation: " + isvalidation)

  var cells_array = []
  
    cells_array = data.map(function(d) {

      var iditem = verb_utils.hashCode(d.reinovalido +
                      d.phylumdivisionvalido + 
                      d.clasevalida + 
                      d.ordenvalido + 
                      d.familiavalida + 
                      d.generovalido + 
                      d.especieepiteto + 
                      d.nombreinfra +
                      d.type + 
                      d.layer + 
                      d.bid)

      if(isvalidation){
        return {
          id: iditem, cells: d.cells_map, score: parseFloat(d.score)
        }  
      }
      else{
        return {
          id: iditem, cells: d.cells, score: parseFloat(d.score)
        }  
      }
      
    })

    
  // se obtiene cada celda con su score
  // var cells = []
  var cell_map = d3.map([])

  cells_array.forEach(function (item, index){

    item.cells.forEach(function (cell_item, index){
      
            
      cells.push({cell: cell_item, score: item.score})
    })

  })

  // debug("***** length CELLS MAP: " + cell_map.values().length)
  // debug("***** length CELLS: " + cells.length)

  // var cross_cells = crossfilter(cells)
  var cross_cells = crossfilter(cell_map.values())
  
  cross_cells.groupAll();
  var cells_dimension = cross_cells.dimension(function(d) { return d.cell; });

  var groupByCell = cells_dimension.group().reduceSum(function(d) { return parseFloat(d.score); });
  var map_cell = groupByCell.top(Infinity)

  var keys = [];
  var cell_score_array = [];

   var val_apriori = 0
   // debug("apriori: " + apriori)
   // debug("mapa_prob: " + mapa_prob)

   if(apriori || mapa_prob){

      // debug("ni: " + data[0].ni)
      // debug("n: " + data[0].n)
      // debug("aprior: " + Math.log(data[0].ni / (data[0].n- data[0].ni)) )
      val_apriori = parseFloat(Math.log(data[0].ni / (data[0].n- data[0].ni)).toFixed(3)) 
      // debug("val_apriori: " + val_apriori)
   }

   for(var i=0; i<map_cell.length; i++){

        const entry = map_cell[i];

        var tscore = parseFloat(entry["value"])
        var gridid = entry["key"]
        keys.push(gridid)

        var apriori_computed = false
        if(apriori){
          tscore = tscore + val_apriori
          apriori_computed = true;
        }
        if(mapa_prob){
          if(tscore <= verb_utils.minscore){
            tscore = 0
          }
          else if(tscore >= verb_utils.maxscore){
            tscore = 1 
          }
          else{
            // verifica que el calculo de apriori no se calcule dos veces
            tscore = apriori_computed ? tscore : tscore+val_apriori
            tscore = Math.exp(tscore) /  (1+Math.exp(tscore))
          }
        }

        // debug("tscore: " + tscore)
        cell_score_array.push({gridid: gridid, tscore: parseFloat(tscore.toFixed(3))})
        
    }

    // debug(keys)

    var test = []
    // debug(val_apriori)
    // debug(all_cells)
    // debug(all_cells["cells"])
    
    // agregando las celdas
    if(all_cells["cells"]){

      for(var i=0; i<all_cells.cells.length; i++){
        var gridid = all_cells.cells[i];
        // debug(gridid)
        if(keys.indexOf(gridid) === -1){
          cell_score_array.push({gridid: gridid, tscore: val_apriori})  
        }

      }
    }

    // debug("cell_score_array: " + cell_score_array.length)
    // debug("gridid: " + cell_score_array[0].gridid)
    // debug("tscore: " + cell_score_array[0].tscore)

    // cell_score_array.sort(function(a, b){
    //   return b.tscore-a.tscore
    // });

    
    return cell_score_array
      

}


verb_utils.processDataForScoreCellTable = function (data){

  var cells_array = data.map(function(d) {
    return {
      cells: d.cells, 
      score: parseFloat(d.score), 
      spid: d.spid, 
      epsilon: parseFloat(d.epsilon), 
      score: parseFloat(d.score), 
      nj: d.nj,
      name: d.especievalidabusqueda
    }
  })

  var cells = []
  cells_array.forEach(function (item, index){
    item.cells.forEach(function (cell_item, index){
          cells.push({
            cell: cell_item, 
            score: item.score, 
            spid: item.spid, 
            epsilon: item.epsilon, 
            score: item.score, 
            nj: item.nj,
            name: item.name
          })
    })
  })
  // debug(cells)

  var cross_cells = crossfilter(cells)
  cross_cells.groupAll();

  var cells_dimension = cross_cells.dimension(function(d) { return d.cell; });

  var groupByScoreCell = cells_dimension.group().reduce(
    function(item,add){
      item.tscore = item.tscore + add.score
      item.spids.push(add.spid)
      item.epsilons.push(add.epsilon)
      item.scores.push(add.score)
      item.njs.push(add.nj)
      item.names.push(add.name)

      return item
    },
    function(item,remove){
      item.tscore = item.tscore - remove.score
      
      var index = item.spids.indexOf(remove.spid);
      if (index > -1) {item.spids.splice(index, 1);}

      index = item.epsilons.indexOf(remove.epsilon);
      if (index > -1) {item.epsilons.splice(index, 1);}

      index = item.scores.indexOf(remove.score);
      if (index > -1) {item.scores.splice(index, 1);}

      index = item.njs.indexOf(remove.nj);
      if (index > -1) {item.njs.splice(index, 1);}

      index = item.names.indexOf(remove.name);
      if (index > -1) {item.names.splice(index, 1);}
      
      return item
    },
    function(){
      return {
        tscore: 0,
        spids: [],
        epsilons: [],
        scores: [],
        njs: [],
        names: []
        
      }
    }
  )
  
  // var groupByCell = cells_dimension.group().reduceSum(function(d) { return parseFloat(parseFloat(d.score).toFixed(3)); });
  var map_cell = groupByScoreCell.top(Infinity);
  // map_cell.sort(verb_utils.compare_desc);
  // debug(map_cell)
  // debug(map_cell[0]["value"])

 var cell_score_array = [];

 for(var i=0; i<map_cell.length; i++){
      const entry = map_cell[i];
      var len = entry["value"].spids.length;

      var item = {};
      item.gridid = entry["key"];
      item.key =  parseFloat((entry["value"].tscore).toFixed(3));

      var species = [];
      for(var j=0; j<len; j++){
        
        var specie = {};
        specie.spid = entry["value"].spids[j];
        specie.epsilon = entry["value"].epsilons[j];
        specie.score = entry["value"].scores[j];
        specie.nj = entry["value"].njs[j];
        specie.name = entry["value"].names[j];

        species.push(specie)        
      } 
      item.species = species;
      cell_score_array.push(item)     

  }
  cell_score_array.sort(verb_utils.compare_desc);
  // debug(cell_score_array)
  // debug(cell_score_array[0].gridid)
  // debug(cell_score_array[0].tscore)
  // debug(cell_score_array[0].species)
  return cell_score_array

}



// verb_utils.processDataForFreqCell = function (data_origin, data, apriori, mapa_prob){
verb_utils.processDataForFreqCell = function (data){

  // var val_apriori = 0
  // debug("apriori: " + apriori)
  // debug("mapa_prob: " + mapa_prob)
  // if(apriori || mapa_prob){
  //   val_apriori = data_origin[0].ni / (data_origin[0].n- data_origin[0].ni)
  //   debug("val_apriori: " + val_apriori)
  // }

  var min_scr = d3.min(data.map(function(d) {return parseFloat(d.tscore);}));
  // debug("min_score: " + min_scr)

  var max_scr = d3.max(data.map(function(d) {return parseFloat(d.tscore);}));
  // debug("min_score: " + max_scr)

  var beans = d3.range(1,buckets+1,1);
  var scrRange = d3.scaleQuantile().domain([min_scr, max_scr]).range(beans);

  var cross_score = crossfilter(data)
  cross_score.groupAll();  

  var scr_dimension = cross_score.dimension(function(d) { 
    // return parseFloat(d.tscore)+val_apriori; 
    return parseFloat(d.tscore) 
  });

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

  debug("processDataForFreqSpecie")

  var min_eps = d3.min(data.map(function(d) {return parseFloat(d.epsilon);}));
  debug("min_eps: " + min_eps)

  var max_eps = d3.max(data.map(function(d) {return parseFloat(d.epsilon);}));
  debug("max_eps: " + max_eps)

  var min_scr = d3.min(data.map(function(d) {return parseFloat(d.score);}));
  debug("min_scr: " + min_scr) 

  var max_scr = d3.max(data.map(function(d) {return parseFloat(d.score);}));
  debug("max_scr: " + max_scr)

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


verb_utils.get_target_cells = function(gridid, where_target, view, region, cells, queries) {
  
  debug("get_target_cells")

  var query = queries.getGridSpeciesNiche.getTargetCells

  return verb_utils.pool.one(query, {

    gridid: gridid,
    where_target: where_target.replace('WHERE', ''),
    view: view,
    region: region, 
    cells: cells

  }).then(resp => {

    //debug(resp)
    
    return resp['target_cells']
    
  })
}

 verb_utils.getValidationDataNoValidation = function (data, target_cells, gridid, where_target, view, region, cells, apriori, mapa_prob, queries) {

  debug("getValidationDataNoValidation")

  var validation_data = []

  var train_cells = verb_utils.processDataForScoreCellValidation(data, apriori, mapa_prob, [], false)
  var temp_map = d3.map([])
  train_cells.forEach(function(obj){

    temp_map.set(obj.gridid, obj.tscore)

  })

  var scored_target_cells = []        
  target_cells.forEach(function(cell){

    var scored_cell = {}
    scored_cell.gridid = cell

    if(temp_map.has(cell)){

      scored_cell.score = temp_map.get(cell)

    } else {

      scored_cell.score = null

    }

    scored_target_cells.push(scored_cell)

  })

  var sorted_scores = temp_map.values()
  sorted_scores.sort(function(a, b){return a-b})
  var N = sorted_scores.length
  var partition = []
  var delta_N = N / 10
  for (var i = 0; i < 10; i++){

    if(i == 0 ) {
      
      partition.push(sorted_scores[0])

    } else {

      partition.push(sorted_scores[parseInt(delta_N*i) - 1])

    }

  }
  partition.push(sorted_scores[N - 1])
  partition = partition.reverse()
  debug(partition)

  var vp = []
  var fn = []
  var nulo = []

  for (var i = 0; i < 10; i ++) {

    vp.push(0)
    fn.push(0)
    nulo.push(0)

    scored_target_cells.forEach(function(item) {

      if(item.score != 'null'){

        if (item.score > partition[i+1]){

          vp[i] += 1

        } else {

          fn[i] += 1
          
        }

      } else {

        nulo[i] += 1 

      }

    })


    validation_data.push({

      decil: i+1,
      vp: vp[i],
      fn: fn[i],
      nulo: nulo[i],
      recall: vp[i] / (vp[i] + fn[i])

    })

  }

  return validation_data  

 }

verb_utils.getValidationValues = function (data_group){

  debug("getValidationValues")

  // debug(data_group)

  var result_test_cells = []

  // obteniendo el score de las celdas del conjunto test basado en los resultados del conjunto de entrenamiento
  data_group.forEach(function(item, index){

    // debug(item.data)
    // debug(item.apriori)
    // debug(item.mapa_prob)

    // obteniendo el score por celda del conjunto de entrenamiento
    var apriori = item.apriori !== false && item.data[0].ni !== undefined ? true : false
    var mapa_prob = item.mapa_prob !== false && item.data[0].ni !== undefined ? true : false
    //var train_cells = verb_utils.processDataForScoreCell(item.data, apriori, mapa_prob, [], false)
    var train_cells = verb_utils.processDataForScoreCellValidation(item.data, apriori, mapa_prob, [], false)
    var temp_map = d3.map([])

    var repeated_cells = d3.map([])

    // Esta dejando el ultimo registro, no realiza un promedio del tscore de las celdas repetidas
    train_cells.forEach(function(item){

      temp_map.set(item.gridid, item.tscore)

    })

    // debug(item.data)
    // debug(temp_map.values())
    // debug(item.test_cells)

    // obtiene el score por celda del conjunto de test
    var temp_values = []
    item.test_cells.forEach(function(cell_item){
    
      var temp_value = {}
      temp_value.cell = cell_item

      if(temp_map.has(cell_item)){
        temp_value.score = temp_map.get(cell_item)
      } else {
        temp_value.score = null 
      }
      temp_values.push(temp_value)

    })


    var array = temp_map.values()
    array.sort(function(a, b){return a-b})
    //debug(array)

    var len =  array.length;
    // debug("min: " + d3.min(array))
    // debug("max: " + d3.max(array))
    // debug(len)

    // se obtienen los limites de los deciles
    var limites = []
    limites.push(array[0])
    limites.push(array[Math.floor(len*.1) - 1])
    limites.push(array[Math.floor(len*.2) - 1])
    limites.push(array[Math.floor(len*.3) - 1])
    limites.push(array[Math.floor(len*.4) - 1])
    limites.push(array[Math.floor(len*.5) - 1])
    limites.push(array[Math.floor(len*.6) - 1])
    limites.push(array[Math.floor(len*.7) - 1])
    limites.push(array[Math.floor(len*.8) - 1])
    limites.push(array[Math.floor(len*.9) - 1])
    limites.push(array[Math.floor(len) - 1])
    
    //debug(limites)
    
    // obtiene los deciles para obtener las métricas basados en lso resultados del conjunto de test
    var num_deciles = 11

    // debug(temp_map.values())
    // debug(train_cells)

    // var min_scr = d3.min(temp_map.values().map(function(d) {return parseFloat(d);}));
    // debug("min_scr: " + min_scr)  
    // var max_scr = d3.max(temp_map.values().map(function(d) {return parseFloat(d);}));
    // debug("max_scr: " + max_scr)    

    // var rango_deciles = d3.scaleQuantile()
    //     .domain([min_scr, max_scr])
    //     .range(d3.range(1,num_deciles))

    // var limites = [min_scr].concat(rango_deciles.quantiles()) 
    // limites = limites.concat(max_scr)

    // // var limites = rango_deciles.quantiles()

    // debug(limites)
    // // debug(temp_values)

    // debug(d3.range(1,num_deciles))

    // var max_scr_test = d3.max(temp_values.map(function(d) {return parseFloat(d.score);}));
    // var min_scr_test = d3.min(temp_values.map(function(d) {return parseFloat(d.score);}));

    // debug("max_scr_ TEST: " + max_scr_test)    
    // debug("min_scr_ TEST: " + min_scr_test)    
    // // debug("max_ TEST: " + rango_deciles(12))    
    // // debug("min_ TEST: " + rango_deciles(220))   
    
    //debug(item.iter) 
    //debug(temp_values)
    
    var deciles = []
    d3.range(1,num_deciles).forEach(function(decil, index){

      var vp_temp = 0
      var fn_temp = 0
      var nulo_temp = 0
      var recall_temp = 0

      temp_values.forEach(function(row_value){
        
        // debug("decil: " + rango_deciles(row_value.score))
        // debug("es VP:" + rango_deciles(row_value.score) > 9)
        //debug("decil: " + decil)


        if(row_value.score === null){
          nulo_temp++
        } else if(row_value.score > limites[decil-1]){
          /*if(decil == 10){
            debug(row_value.cell, row_value.score, limites[decil-1])  
          }*/
          vp_temp++
        } else{
          fn_temp++
        }

        // if(rango_deciles(row_value.score) > decil){
        //   vp_temp++
        // }
        // else if(row_value.score === 0){
        //   nulo_temp++
        // }
        // else{
        //   fn_temp++
        // }
        
      })

      // debug("*****************")
      // debug("umbral: " + limites[decil-1])
      // debug("decil: " + decil)
      // debug("vp_temp: " + vp_temp)
      // debug("fn_temp: " + fn_temp)
      // debug("nulo_temp: " + nulo_temp)
      // debug("*****************")

      var result_iter = {}
      
      result_iter.iter = item.iter
      result_iter.decil = decil
      result_iter.vp = vp_temp
      result_iter.fn = fn_temp
      result_iter.nulo = nulo_temp
      result_iter.recall = vp_temp/(vp_temp+fn_temp)

      result_test_cells.push(result_iter)


    })

  })

  // debug(result_test_cells)


  var cross_cells = crossfilter(result_test_cells)
  cross_cells.groupAll();

  var decil_dimension = cross_cells.dimension(function(d) { return d.decil; });
  
  var groupByDecil = decil_dimension.group().reduce(
    function(item,add){
      ++item.count
      
      item.vp += add.vp
      item.fn = item.fn + add.fn
      item.nulo = item.nulo + add.nulo
      item.recall = item.recall + add.recall
      
      return item
    },
    function(item,remove){
      --item.count
      
      item.vp -= remove.vp
      item.fn = item.fn - remove.fn
      item.nulo = item.nulo - remove.nulo
      item.recall = item.recall - remove.recall

      return item
    },
    function(){
      return {
        count: 0,
        vp: 0,
        fn: 0,
        nulo: 0,
        recall: 0
      }
    }
  )

  var reduce_data = groupByDecil.top(Infinity);
  // var score_cell_decil = groupByScoreCell.top(Infinity);
  reduce_data.sort(verb_utils.compare_desc)



  var data_result = []
  for(var i=0; i<reduce_data.length; i++){
      const entry = reduce_data[i];

      // debug(entry["value"])

      data_result.push({
        decil: entry["key"],
        vp: parseFloat((entry["value"].vp / entry["value"].count).toFixed(2)),
        fn: parseFloat((entry["value"].fn / entry["value"].count).toFixed(2)),
        nulo: parseFloat((entry["value"].nulo / entry["value"].count).toFixed(2)),
        recall: parseFloat((entry["value"].recall / entry["value"].count).toFixed(2))
        
      })
  }

  // debug(data_result)

  return data_result

}

verb_utils.hashCode = function(str) {
  return str.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0))|0, 0);
}

verb_utils.updateObj = function(arr) {
  arr.forEach(function(el) {
    var key = el.tempid;
    obj[key] = obj[key] || { count: 0, total: 0, avg: 0 };
    obj[key].count++;
    obj[key].total += el.val;
    obj[key].avg = obj[key].total / obj[key].count;
  });
}

verb_utils.processGroupValidationData = function(data_group) {

  debug("processGroupValidationData")

  var data = []
  
  data_group.forEach(function(item){

    item['data'].forEach(function(element){

      element.tempid = verb_utils.hashCode(element.reinovalido +
                      element.phylumdivisionvalido + 
                      element.clasevalida + 
                      element.ordenvalido + 
                      element.familiavalida + 
                      element.generovalido + 
                      element.especieepiteto + 
                      element.nombreinfra +
                      element.type + 
                      element.layer + 
                      element.bid)
    })
    
  })

  // P  se agrupan todos los array data_i en un solo array de arrays, esto es [data_1, data_2, data_3, data_4, data_5]
  var data_map = data_group.map(function(d) {return  d.data})

  data_map.forEach(function(item) {
    data = data.concat(item)
  })



  /*var score_total = 0;
  data.forEach(function(item){

    item['cells'].forEach(function(cell){

      if(cell == 56688) {


        score_total += parseFloat(item['score']);
        debug('iter ' + item['iter']+ ' score de variable ' + item['bid'] + ' ' + item['score'])
      
      }

    })

  })
  debug("score_total " + score_total)*/

  //debug('data ' + data.length/5)
  // P data es un arreglo con los data_i concatenados

  /****** implementación con map ********/

  // var data_map = d3.map([])
  // var counter = 0;

  // data.forEach(function (row_item, index){

  //   if(!data_map.has(row_item.tempid)){
  //     row_item.count = 1
  //     row_item.cells_map = []
  //     row_item.epsilon = row_item.epsilon === undefined || row_item.epsilon === null  ? 0 : parseFloat(row_item.epsilon) 
  //     row_item.score = row_item.score === undefined || row_item.score === null ? 0 : parseFloat(row_item.score) 

  //     data_map.set(row_item.tempid,row_item)
  //   }
  //   else{
      
  //     // promedio (con n y ni variable) Varian por que existen especies que no estan en las 5 iteraciones, al promediar hacen variar la n y ni
  //     var item = data_map.get(row_item.tempid)
  //     item.n += row_item.n
  //     item.ni += row_item.ni
  //     item.nij += row_item.nij
  //     item.nj += row_item.nj
  //     item.epsilon += row_item.epsilon === undefined || row_item.epsilon === null  ? 0 : parseFloat(row_item.epsilon) 
  //     item.score += row_item.score === undefined || row_item.score === null ? 0 : parseFloat(row_item.score) 

  //     item.cells = item.cells.concat(row_item.cells)
  //     // item.cells_map = item.cells.filter(function (item_dep, pos) {return item.cells.indexOf(item_dep) == pos})
  //     item.cells_map = item.cells.filter(function (item_dep, pos) {return item.cells.indexOf(item_dep) == pos})
  //     // item.cells_map = item.cells

  //     item.count++
  //   }

  // })

  // var data_result = data_map.values()
  
  // data_result.forEach(function (item, index){

  //   // if(item.generovalido === "Microtus" && item.especieepiteto === "guatemalensis"){
  //   //   debug("************")
  //   //   debug("sp: " + item.generovalido + " " + item.especieepiteto )
  //   //   debug("N: " + item.n)
  //   //   debug("ni: " + item.ni)
  //   //   debug("epsilon: " + item.epsilon)
  //   //   debug("score: " + item.score)
  //   //   debug("tempid: " + item.tempid)
  //   //   debug("count: " + item.count)
  //   //   debug("************")
  //   // }

  //     item.n = parseFloat(item.n / item.count).toFixed(2) 
  //     item.ni = parseFloat(item.ni / item.count) .toFixed(2)
  //     item.nij = parseFloat(item.nij / item.count).toFixed(2) 
  //     item.nj = parseFloat(item.nj / item.count) .toFixed(2)
  //     item.epsilon = parseFloat(item.epsilon / item.count) .toFixed(2)
  //     item.score = parseFloat(item.score / item.count) .toFixed(2)
    
  // })

  /****** termina implementación con map ********/



  /****** implementación con crossfilter ********/

  
  var cross_group = crossfilter(data)
  cross_group.groupAll()
  
  // // debug(cross_group)
  // // debug(verb_utils.hashCode("hola"))
  // // debug(verb_utils.hashCode("hola"))
  // // debug(verb_utils.hashCode("hola2"))
  

  // // var name_dimension = cross_group.dimension(function(d) { return d.name; })  
  var name_dimension = cross_group.dimension(function(d) { return d.tempid})

  var group_by_name = name_dimension.group().reduce(
    
    function(item, add){

      ++item.count

      item.reinovalido = add.reinovalido
      item.phylumdivisionvalido = add.phylumdivisionvalido
      item.clasevalida = add.clasevalida
      item.ordenvalido = add.ordenvalido
      item.familiavalida = add.familiavalida
      item.generovalido = add.generovalido
      item.especieepiteto = add.especieepiteto
      item.nombreinfra = add.nombreinfra
      item.type = add.type
      item.layer = add.layer
      item.bid = add.bid
      item.icat = add.icat
      item.tag =  add.tag

      item.cells = add.cells


      item.cells_map = item.cells_map.concat(add.cells) 

      item.nij += add.nij
      item.nj += add.nj
      
      item.ni += add.ni
      item.n += add.n

      if(add.epsilon !== undefined && add.epsilon !== null){
        item.epsilon += parseFloat(add.epsilon)
        ++item.count_eps
      }
      
      if(add.score !== undefined && add.score !== null){
        item.score += parseFloat(add.score)
        ++item.count_scr
      }
      
      item.tipo = add.tipo

      return item
    },
    function(item,remove){
      --item.count
      item.reinovalido = remove.reinovalido
      item.phylumdivisionvalido = remove.phylumdivisionvalido
      item.clasevalida = remove.clasevalida
      item.ordenvalido = remove.ordenvalido
      item.familiavalida = remove.familiavalida
      item.generovalido = remove.generovalido
      item.especieepiteto = remove.especieepiteto
      item.nombreinfra = remove.nombreinfra
      item.type = remove.type
      item.layer = remove.layer
      item.bid = remove.bid
      item.icat = remove.icat
      item.tag = remove.tag
      
      item.cells = item.cells //remove.cells //
      item.cells_map = item.cells_map

      item.nij -= remove.nij
      item.nj -= remove.nj
      
      item.ni -= remove.ni
      item.n -= remove.n

      if(remove.epsilon !== undefined && remove.epsilon !== null){
        item.epsilon -= parseFloat(remove.epsilon)
        --item.count_eps
      }
      
      if(remove.score !== undefined && remove.score !== null){
        item.score -= parseFloat(remove.score)
        --item.count_scr
      }
      
      // item.epsilon -= parseFloat(remove.epsilon) 
      // item.score -= parseFloat(remove.score) 
      item.tipo = item.tipo

      return item
    },
    function(){
      return {
        count: 0,
        count_eps: 0,
        count_scr: 0,
        reinovalido: "",
        phylumdivisionvalido: "",
        clasevalida: "",
        ordenvalido: "",
        familiavalida: "",
        generovalido: "",
        especieepiteto: "",
        nombreinfra:"",
        type:"",
        layer:"",
        bid:"",
        icat:"",
        tag:"",
        cells: [],
        cells_map: [],
        nij: 0,
        nj: 0,
        ni: 0,
        n: 0,
        epsilon: 0,
        score: 0,
        tipo: 0
      }
    }
  )

  var reduced_data = group_by_name.top(Infinity);

  var data_result = []

  debug('reduced ' + reduced_data.length)

  for(var i=0; i<reduced_data.length; i++){
      var entry = reduced_data[i]
      var counter = parseInt(entry["value"].count)
      var count_eps = parseInt(entry["value"].count_eps)
      var count_scr = parseInt(entry["value"].count_scr)

      data_result.push({
        reinovalido: entry["value"].reinovalido,
        phylumdivisionvalido: entry["value"].phylumdivisionvalido,
        clasevalida: entry["value"].clasevalida,
        ordenvalido: entry["value"].ordenvalido,
        familiavalida: entry["value"].familiavalida,
        generovalido: entry["value"].generovalido,
        especieepiteto: entry["value"].especieepiteto,
        nombreinfra: entry["value"].nombreinfra,
        type: entry["value"].type,
        layer: entry["value"].layer,
        bid: entry["value"].bid, 
        icat: entry["value"].icat,
        tag: entry["value"].tag,
        
        cells: entry["value"].cells,
        cells_map: entry["value"].cells_map,

        nij: parseFloat((entry["value"].nij/counter ).toFixed(2)),
        nj: parseFloat((entry["value"].nj/counter ).toFixed(2)),
        
        ni: parseFloat(parseInt(entry["value"].ni)/counter).toFixed(2),
        n:  parseFloat(parseInt(entry["value"].n)/counter).toFixed(2),

        epsilon: parseFloat((entry["value"].epsilon/count_eps).toFixed(2)),
        score: parseFloat((entry["value"].score/count_scr).toFixed(2)),

        tipo: entry["value"].tipo
      })
  }

  // debug('............................................')
  // debug(data_result.map(function(d) {return  d.ni}))
  // debug(data_result.map(function(d) {return  d.n}))
  // debug('............................................')

  data_result.forEach(function(item) {

    //debug('----------------> ' +  item['bid'])
    item['cells_map'] = Array.from(new Set(item['cells_map']))

  })

  return data_result
}

verb_utils.processValidationData = function (data_group){

  debug("processValidationData")

  var avgdata = {}
  var data = []

  var data_map = data_group.map(function(d) {return  d.data})
  // var test_cells = data_group.map(function(d) {return  d.test})
  // debug(test_cells)

  data_map.forEach(function(item){
    // debug(item)
    data = data.concat(item)
  })
  // debug(data)
  
  
  var cross_species = crossfilter(data)
  cross_species.groupAll();

  var spid_dimension = cross_species.dimension(function(d) { return parseFloat(d.spid); });
  
  var groupBySpid = spid_dimension.group().reduce(
    function(item,add){
      ++item.count
      // item.spid = item.spid
      item.reinovalido = add.reinovalido
      item.phylumdivisionvalido = add.phylumdivisionvalido
      item.clasevalida = add.clasevalida
      item.ordenvalido = add.ordenvalido
      item.familiavalida = add.familiavalida
      item.generovalido = add.generovalido
      item.especievalidabusqueda = add.especievalidabusqueda
      item.cells = add.cells
      item.cells_map = item.cells_map.concat(add.cells) 
      // item.nij += add.nij
      // item.nj += add.nj
      // item.ni += add.ni
      // item.n += add.n
      // item.epsilon = parseFloat(item.epsilon) + parseFloat(add.epsilon)
      // item.score = parseFloat(item.score) + parseFloat(add.score)
      item.nij = add.nij
      item.nj = add.nj
      item.ni = add.ni
      item.n = add.n
      item.epsilon = parseFloat(add.epsilon) 
      item.score = parseFloat(add.score)
      
      return item
    },
    function(item,remove){
      --item.count
      // item.spid = item.spid
      item.reinovalido = remove.reinovalido
      item.phylumdivisionvalido = remove.phylumdivisionvalido
      item.clasevalida = remove.clasevalida
      item.ordenvalido = remove.ordenvalido
      item.familiavalida = remove.familiavalida
      item.generovalido = remove.generovalido
      item.especievalidabusqueda = remove.especievalidabusqueda
      item.cells = item.cells //remove.cells //
      item.cells_map = item.cells_map
      // item.nij -= remove.nij
      // item.nj -= remove.nj
      // item.ni -= remove.ni
      // item.n -= remove.n
      // item.epsilon =  parseFloat(item.epsilon) - parseFloat(remove.epsilon)
      // item.score = parseFloat(item.score) - parseFloat(remove.score)
      item.nij = item.nij
      item.nj = item.nj
      item.ni = item.ni
      item.n = item.n
      item.epsilon =  parseFloat(item.epsilon) 
      item.score = parseFloat(item.score)
      
      return item
    },
    function(){
      return {
        count: 0,
        // spid: 0,
        cells: [],
        cells_map: [],
        reinovalido: "",
        phylumdivisionvalido: "",
        clasevalida: "",
        ordenvalido: "",
        familiavalida: "",
        generovalido: "",
        especievalidabusqueda: "",
        // cells: [],
        nij: 0,
        nj: 0,
        ni: 0,
        n: 0,
        epsilon: 0,
        score: 0
      }
    }
  )

  

  var reduce_data = groupBySpid.top(Infinity);


  var data_result = []
  for(var i=0; i<reduce_data.length; i++){
      const entry = reduce_data[i];
      data_result.push({
        spid: entry["key"], 
        reinovalido: entry["value"].reinovalido,
        phylumdivisionvalido: entry["value"].phylumdivisionvalido,
        clasevalida: entry["value"].clasevalida,
        ordenvalido: entry["value"].ordenvalido,
        familiavalida: entry["value"].familiavalida,
        generovalido: entry["value"].generovalido,
        especievalidabusqueda: entry["value"].especievalidabusqueda,
        cells: entry["value"].cells, //entry["value"].cells.filter(function (item, pos) {return entry["value"].cells.indexOf(item) == pos}),
        cells_map: entry["value"].cells_map,
        // nij: parseFloat((entry["value"].nij / entry["value"].count).toFixed(2)),
        // nj: parseFloat((entry["value"].nj / entry["value"].count).toFixed(2)),
        // ni: parseFloat((entry["value"].ni / entry["value"].count).toFixed(2)),
        // n: parseFloat((entry["value"].n / entry["value"].count).toFixed(2)),
        // epsilon: parseFloat((entry["value"].epsilon / entry["value"].count).toFixed(2)),
        // score: parseFloat((entry["value"].score / entry["value"].count).toFixed(2))
        // n: Math.floor(entry["value"].n / entry["value"].count),
        nij: parseFloat((entry["value"].nij ).toFixed(2)),
        nj: parseFloat((entry["value"].nj ).toFixed(2)),
        ni: parseFloat((entry["value"].ni ).toFixed(2)),
        n: parseFloat((entry["value"].n ).toFixed(2)),
        epsilon: parseFloat((entry["value"].epsilon).toFixed(2)),
        score: parseFloat((entry["value"].score).toFixed(2))
      })
  }

  return data_result;
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

verb_utils.parseHrtimeToSeconds = function(hrtime) {
    var seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    return seconds;
}



verb_utils.arrayToString = function (species_array){

  var species_list = ""

  species_array.forEach(function(species, index) {
    if(index === 0)
      species_list += "'" + species + "'"
    else
      species_list += ",'" + species + "'"
  });

  return species_list

}

verb_utils.processTargetSpecies = function (species_array){

  debug("processTargetSpecies")

  var whereVar = ''

  for (var i = 0; i < species_array.length; i++) {

    species_array.forEach(function(species, index) {
    
    if(index === 0)
        whereVar += " where spid = " + species + " "
      else
        whereVar += "or spid = " + species + " "
    });

  }
    
  return whereVar

}


verb_utils.getWhereClauseFromSpeciesArray = function (species_array){

  debug("getWhereClauseFromSpeciesArray")

  var whereVar = ''

  species_array.forEach(function(species, index) {
  
    if(index === 0)
      whereVar += " where spid = " + species + " "
    else
      whereVar += "or spid = " + species + " "

  })
    
  return whereVar

}

verb_utils.getWhereClauseFilter = function(fosil, date, lim_inf, lim_sup, cells, gridid, footprint_region, gid){
  
  debug("getWhereClauseFilter")  

  var whereClause = 'WHERE ('

  gid.forEach(function(gid, index){
    if(index === 0)
      whereClause += 'gid = ' + gid + ' '
    else 
      whereClause += 'OR gid = ' + gid + ' '
  })
  whereClause += ') '

  if(!fosil){
    whereClause += "AND (ejemplarfosil <>'SI' OR ejemplarfosil is null) "
  }

  if(date) {
    whereClause += 'AND aniocolecta >= ' + lim_inf + ' AND  aniocolecta <= ' + lim_sup + ' '
  }

  cells.forEach(function(cell, index){
    whereClause += 'AND ' + gridid + ' <> ' + cell + ' ' 
  })

  whereClause += 'AND ' + gridid + ' is not null '
  //whereClause += 'AND aniocolecta is not null '

  debug(whereClause)
  return whereClause   
}

verb_utils.getFieldsFromLevel = function (level) {

  debug("getGroupByFromGroupTaxonArray")

  var fields = ""
  var biotic = true
  var notyet = true

  var taxon_map = {
                    // biotic
                    kingdom : 'reinovalido', 
                    phylum  : 'phylumdivisionvalido',
                    class   : 'clasevalida',
                    order   : 'ordenvalido',
                    family  : 'familiavalida',
                    genus   : 'generovalido',
                    species : ['generovalido', 'especieepiteto'],
                    subspecies: ['generovalido', 'especieepiteto', 'nombreinfra']
                  }

  var rank_map = {
                    // abiotic
                    type    : 'type',
                    layer   : 'layer',
                    bid     : 'bid'
                }

  if (level === 'type' || level === 'layer' || level === 'bid')
    biotic = false

  for (var key in taxon_map) {

    if (biotic && notyet) {

      if (level === key) {

        if (key === 'kingdom') {

          notyet = false
          fields += taxon_map[key]

        } else if(key === 'species') {

          notyet = false
          fields += ", " + taxon_map[key][1]           

        } else if(key === 'subspecies') {

          notyet = false
          fields += ", " + taxon_map[key][2]

        } else {

          notyet = false
          fields += ", " + taxon_map[key]
        
        }
      
      } else {

        if (key === 'kingdom'){

          fields += taxon_map[key]

        } else if (key === 'species'){

          fields += ", "  + taxon_map[key][1]          

        } else if(key === 'subspecies') {

          fields += ", " + taxon_map[key][2]

        } else {

          fields += ", " + taxon_map[key] 
        
        }

      }

    } else {

      if (key === 'kingdom')
        fields += "'' AS " + taxon_map[key]
      else if(key === 'species')
        fields += ", '' AS " + taxon_map[key][1]
      else if(key === 'subspecies')
        fields += ", '' AS " + taxon_map[key][2]        
      else
        fields += ", '' AS " + taxon_map[key]

    }

    //debug(fields)

  }

  for (var key in rank_map) {

    if (!biotic && notyet) {

      if (level === key) {

          notyet = false
          fields += ", " + rank_map[key]


      } else {

          fields += ", " + rank_map[key] 

      }

    } else {

        fields += ", '' AS " + rank_map[key]

    }

    //debug(fields)    

  }

  if (level === 'bid')
    fields  += ", icat, tag "
  else 
    fields  += ", '' AS icat, '' AS tag "

  //debug("fields =" + fields)
  return fields

}

verb_utils.getGroupFieldsFromLevel = function (level) {

  debug("getGroupByFromGroupTaxonArray")

  var group_fields = ""
  var biotic = true
  var notyet = true

  var taxon_map = {
                    // biotic
                    kingdom : 'reinovalido', 
                    phylum  : 'phylumdivisionvalido',
                    class   : 'clasevalida',
                    order   : 'ordenvalido',
                    family  : 'familiavalida',
                    genus   : 'generovalido',
                    species : ['generovalido', 'especieepiteto'],
                    subspecies: ['generovalido', 'especieepiteto', 'nombreinfra'],
                      
                  }

  var rank_map = {

                    // abiotic
                    type    : 'type',
                    layer   : 'layer',
                    bid     : 'bid'

                  }

  if (level === 'type' || level === 'layer' || level === 'bid')
    biotic = false


  if (biotic) {
    
    for (var key in taxon_map) {

      if (level === key) {

        if(level === "kingdom")
          group_fields += taxon_map[key]
        else if(level === "species")
          group_fields += ", " + taxon_map[key][1] 
        else if(level === "subspecies")
          group_fields += ", " + taxon_map[key][2]
        else
          group_fields += ", " + taxon_map[key]

        break

      } else {
        
        if(key === "kingdom")
          group_fields += taxon_map[key]
        else if(key === "species")
          group_fields += ", " + taxon_map[key][1]
        else if(key === "subspecies")
          group_fields += ", " + taxon_map[key][2]
        else
          group_fields += ", " + taxon_map[key]        

      }

    }

  } else {

    for (var key in rank_map) {

      if (key === level) {

        if(key === "type")
          group_fields += rank_map[key]
        else
          group_fields += ", " + rank_map[key]
        break

      } else {

        if(key === "type")
          group_fields += rank_map[key]
        else
          group_fields += ", " + rank_map[key]

      }

    }

   if(level === 'bid')
        group_fields += ", icat, tag "

  }


  //debug("group fields ="  + group_fields)
  return group_fields

}

verb_utils.getWhereClauseFromGroupTaxonArray = function (taxon_array, target){

  debug("getWhereClauseFromGroupTaxonArray")

  if(target)
    var key = 'taxon_rank'
  else
    var key='rank'
  // mapeo de taxones
  var taxon_rank_map = {
                          // biotic
                          kingdom : 'reinovalido', 
                          phylum  : 'phylumdivisionvalido',
                          class   : 'clasevalida',
                          order   : 'ordenvalido',
                          family  : 'familiavalida',
                          genus   : 'generovalido',
                          species : ['generovalido', 'especieepiteto'],
                          subspecies: ['generovalido', 'especieepiteto', 'nombreinfra'],
                          // abiotic
                          type    : 'type',
                          layer   : 'layer',
                          bid     : 'bid'
                       }
  
  var whereClause = ''
  taxon_array.forEach ( function (taxon, index) {
    //debug(taxon_rank_map[taxon[key]], taxon[key])
    if (index === 0){
      
      if (taxon[key] === 'species') {
        var value = taxon['value'].split(' ')
        whereClause += " WHERE (" + taxon_rank_map[taxon[key]][0] + " = '" + value[0] + "' AND " + taxon_rank_map[taxon[key]][1] + " = '" + value[1] + "')"
      } else if(taxon[key] === 'subspecies') {
        var value = taxon['value'].split(' ')
        whereClause += " WHERE (" + taxon_rank_map[taxon[key]][0] + " = '" + value[0] + "' AND " + taxon_rank_map[taxon[key]][1] + " = '" + value[1] + "' AND " + taxon_rank_map[taxon[key]][2] + " = '" + value[2] + "')"
      } else {
        whereClause += " WHERE " + taxon_rank_map[taxon[key]] + " = '" + taxon['value'] + "'"
      }

    } else{
      
      if (taxon[key] === 'species') {
        var value = taxon['value'].split(' ')
        whereClause += " or (" + taxon_rank_map[taxon[key]][0] + " = '" + value[0] + "' AND " + taxon_rank_map[taxon[key]][1] + " = '" + value[1] + "')"
      } else if(taxon[key] === 'subspecies') {
        var value = taxon['value'].split(' ')
        whereClause += " or (" + taxon_rank_map[taxon[key]][0] + " = '" + value[0] + "' AND " + taxon_rank_map[taxon[key]][1] + " = '" + value[1] + "' AND " + taxon_rank_map[taxon[key]][2] + " = '" + value[2] + "')" 
      } else {
        whereClause += " or " + taxon_rank_map[taxon[key]] + " = '" + taxon['value'] + "'"
      }

    } 
      
  })

  return whereClause

}


verb_utils.getExcludeTargetWhereClause = function (taxon_array) {

  debug("getExcludeTargetWhereClause")

  var key = 'taxon_rank'
  // mapeo de taxones
  var taxon_rank_map = {
                          // biotic
                          kingdom : 'reinovalido', 
                          phylum  : 'phylumdivisionvalido',
                          class   : 'clasevalida',
                          order   : 'ordenvalido',
                          family  : 'familiavalida',
                          genus   : 'generovalido',
                          species : ['generovalido', 'especieepiteto'],
                          subspecies: ['generovalido', 'especieepiteto', 'nombreinfra'],
                          // abiotic
                          type    : 'type',
                          layer   : 'layer',
                          bid     : 'bid'
                       }
  
  var whereClause = ''
  taxon_array.forEach ( function (taxon, index) {
    //debug(taxon_rank_map[taxon[key]], taxon[key])
    if (index === 0){
      
      if (taxon[key] === 'species') {
        var value = taxon['value'].split(' ')
        whereClause += " AND (" + taxon_rank_map[taxon[key]][0] + " <> '" + value[0] + "' AND " + taxon_rank_map[taxon[key]][1] + " <> '" + value[1] + "')"
      } else if(taxon[key] === 'subspecies') {
        var value = taxon['value'].split(' ')
        whereClause += " AND (" + taxon_rank_map[taxon[key]][0] + "<> '" + value[0] + "' AND " + taxon_rank_map[taxon[key]][1] + " <> '" + value[1] + "' AND " + taxon_rank_map[taxon[key]][2] + " <> '" + value[2] + "')"
      } else {
        whereClause += " AND " + taxon_rank_map[taxon[key]] + " <> '" + taxon['value'] + "'"
      }

    } else{
      
      if (taxon[key] === 'species') {
        var value = taxon['value'].split(' ')
        whereClause += " AND (" + taxon_rank_map[taxon[key]][0] + " <> '" + value[0] + "' AND " + taxon_rank_map[taxon[key]][1] + " <> '" + value[1] + "')"
      } else if(taxon[key] === 'subspecies') {
        var value = taxon['value'].split(' ')
        whereClause += " AND (" + taxon_rank_map[taxon[key]][0] + " <> '" + value[0] + "' AND " + taxon_rank_map[taxon[key]][1] + " <> '" + value[1] + "' AND " + taxon_rank_map[taxon[key]][2] + " <> '" + value[2] + "')" 
      } else {
        whereClause += " AND " + taxon_rank_map[taxon[key]] + " <> '" + taxon['value'] + "'"
      }

    } 
      
  })

  //debug(whereClause)
  return whereClause


}

verb_utils.getCovarGroupQueries = function (queries, data_request, covars_groups) {
  
  debug("getCovarGroupQueries")
  
  var query_covar
  var where_covar
  var group_fields
  var fields
  var size = covars_groups.length
  var co = queries.countsTaxonGroups.getCellsByGroupBio.toString()
  var coa =  queries.countsTaxonGroups.getCellsByGroupAbio.toString()
  var cov = ""
  var cova = ""

  debug(size + " groups in niche analysis")

  covars_groups.forEach( function (group, index) {

    if(group['biotic']){

      where_covar = verb_utils.getWhereClauseFromGroupTaxonArray(group['merge_vars'], false)
      //debug("level = " + group['merge_vars'][0]['level'])
      group_fields = verb_utils.getGroupFieldsFromLevel(group['merge_vars'][0]['level']) 
      fields = verb_utils.getFieldsFromLevel(group['merge_vars'][0]['level'])

      if( index === 0){

        query_covar = queries.countsTaxonGroups.covarBioGroup.toString()

        if(size === 1) {
          query_covar = query_covar.toString().replace(/{groups}/g, "," + queries.countsTaxonGroups.getCountsCovars.toString())
          query_covar = query_covar.toString().replace(/{groups}/g, co + group['name'])
        } else {

          cov = co + group['name']

        }

      } else if(index === size - 1){
        
        cov += " UNION " + co + group['name']
        query_covar = query_covar.toString().replace(/{groups}/g, ", " + queries.countsTaxonGroups.covarBioGroup.toString())
        query_covar = query_covar.toString().replace(/{groups}/g, ", " + queries.countsTaxonGroups.getCountsCovars.toString())
        query_covar = query_covar.toString().replace(/{groups}/g, cov)

      } else {

        cov += " UNION " + co + group['name']
        query_covar = query_covar.toString().replace(/{groups}/g, ", " + queries.countsTaxonGroups.covarBioGroup.toString())

      }

      //debug(data_request["total_cells"])
      query_covar = query_covar.toString().replace(/{fields:raw}/g, fields)
      query_covar = query_covar.toString().replace(/{group_fields:raw}/g, group_fields)
      query_covar = query_covar.toString().replace(/{name:raw}/g, group['name'])
      query_covar = query_covar.toString().replace(/{res_celda_sp:raw}/g, data_request["res_celda_sp"])
      query_covar = query_covar.toString().replace(/{where_covars:raw}/g, where_covar)
      query_covar = query_covar.toString().replace(/{excluded_cells:raw}/g, data_request["excluded_cells"].toString())
      query_covar = query_covar.toString().replace(/{total_cells:raw}/g, data_request["total_cells"])
      query_covar = query_covar.toString().replace(/{where_exclude_target:raw}/g, data_request["where_exclude_target"])
      query_covar = query_covar.toString().replace(/{min_occ:raw}/g, data_request["min_occ"])
       
    } else {

      where_covar = verb_utils.getWhereClauseFromGroupTaxonArray(group['merge_vars'], false)
      group_fields = verb_utils.getGroupFieldsFromLevel(group['merge_vars'][0]['level']) 
      fields = verb_utils.getFieldsFromLevel(group['merge_vars'][0]['level'])

      if (index === 0 ) {

        query_covar = queries.countsTaxonGroups.covarAbioGroup.toString()

        if(size === 1) {
          query_covar = query_covar.toString().replace(/{groups}/g, "," + queries.countsTaxonGroups.getCountsCovars.toString())
          query_covar = query_covar.toString().replace(/{groups}/g, coa + group['name'])
        } else {

          cov = coa + group['name']

        }

      } else if(index === size - 1){

        cov += " UNION " + coa + group['name']
        query_covar = query_covar.toString().replace(/{groups}/g, ", " + queries.countsTaxonGroups.covarAbioGroup.toString())
        query_covar = query_covar.toString().replace(/{groups}/g, ", " + queries.countsTaxonGroups.getCountsCovars.toString())
        query_covar = query_covar.toString().replace(/{groups}/g, cov)

      }else {

        cov += " UNION " + coa + group['name']
        query_covar = query_covar.toString().replace(/{groups}/g, ", " + queries.countsTaxonGroups.covarAbioGroup.toString())

      }

      query_covar = query_covar.toString().replace(/{fields:raw}/g, fields)
      query_covar = query_covar.toString().replace(/{group_fields:raw}/g, group_fields)
      query_covar = query_covar.toString().replace(/{name:raw}/g, group['name'])
      query_covar = query_covar.toString().replace(/{res_celda:raw}/g, data_request["res_celda"])
      query_covar = query_covar.toString().replace(/{where_covars:raw}/g, where_covar)
      query_covar = query_covar.toString().replace(/{region:raw}/g, data_request.region)
      query_covar = query_covar.toString().replace(/{res_celda_snib_tb:raw}/g, data_request.res_celda_snib_tb)
      query_covar = query_covar.toString().replace(/{excluded_cells:raw}/g, data_request["excluded_cells"].toString())
      query_covar = query_covar.toString().replace(/{total_cells:raw}/g, data_request["total_cells"])
      query_covar = query_covar.toString().replace(/{min_occ:raw}/g, data_request["min_occ"])

    }
    
  })
  
  //debug(query_covar)
  return query_covar  
}

verb_utils.getCommunityAnalysisQuery = function(queries, region, res_cells, region_cells, res_views, source, is_target){

  debug("getCommunityAnalysisQuery")

  var query = queries.taxonsGroupNodes.nodesSource
  var q_aux = ""
  var q_select = ""
  var q = ""
  var fields
  var group_fields
  var level
  var where
  var label = is_target ? 'target' : 'source'

  source.forEach( function (taxon, index) {

    if (taxon["biotic"]){
      
      if(index === 0) {
        level = taxon["level"]
        q = queries.taxonsGroupNodes.nodesBio
        fields = verb_utils.getFieldsFromLevel(level)
        group_fields = verb_utils.getGroupFieldsFromLevel(level)
        where = verb_utils.getWhereClauseFromGroupTaxonArray([taxon], false)
        
        q = q.toString().replace(/{index:raw}/g, index)
        q = q.toString().replace(/{fields:raw}/g, fields)
        q = q.toString().replace(/{biotic:raw}/g, 'true')
        q = q.toString().replace(/{region_cells:raw}/g, region_cells)
        q = q.toString().replace(/{where_filter:raw}/g, where)
        q = q.toString().replace(/{level:raw}/g, level)
        q = q.toString().replace(/{group_fields:raw}/g, group_fields)

      } else {

        q_aux    =  queries.taxonsGroupNodes.covarBio
        q_select = " UNION " + queries.taxonsGroupNodes.selectNodes
        
        level = taxon["level"]
        fields = verb_utils.getFieldsFromLevel(level)
        group_fields = verb_utils.getGroupFieldsFromLevel(level)
        where = verb_utils.getWhereClauseFromGroupTaxonArray([taxon], false)
        
        q_aux = q_aux.toString().replace(/{index:raw}/g, index)
        q_aux = q_aux.toString().replace(/{biotic:raw}/g, 'true')
        q_aux = q_aux.toString().replace(/{fields:raw}/g, fields)
        q_aux = q_aux.toString().replace(/{region_cells:raw}/g, region_cells)
        q_aux = q_aux.toString().replace(/{where_filter:raw}/g, where)
    
        q_select = q_select.toString().replace(/{index:raw}/g, index)
        q_select = q_select.toString().replace(/{fields:raw}/g, fields)
        q_select = q_select.toString().replace(/{group_fields:raw}/g, group_fields)

        q = q.toString().replace(/{aux:raw}/g, q_aux + ' {aux:raw}')
        q = q.toString().replace(/{union:raw}/g, q_select + ' {union:raw}')

      }

    } else {

      if(index === 0) {

        level = taxon["level"]
        q = queries.taxonsGroupNodes.nodesAbio
        fields = verb_utils.getFieldsFromLevel(level)
        group_fields = verb_utils.getGroupFieldsFromLevel(level)
        where = verb_utils.getWhereClauseFromGroupTaxonArray([taxon], false)
        
        q = q.toString().replace(/{index:raw}/g, index)
        q = q.toString().replace(/{fields:raw}/g, fields)
        q = q.toString().replace(/{biotic:raw}/g, 'false')
        q = q.toString().replace(/{region:raw}/g, region)
        q = q.toString().replace(/{res_cells:raw}/g, res_cells)
        q = q.toString().replace(/{res_views:raw}/g, res_views)
        q = q.toString().replace(/{where_filter:raw}/g, where)
        q = q.toString().replace(/{level:raw}/g, level)
        q = q.toString().replace(/{group_fields:raw}/g, group_fields)

      } else {

        q_aux    = queries.taxonsGroupNodes.covarAbio
        q_select = " UNION " + queries.taxonsGroupNodes.selectNodes
        
        level = taxon["level"]
        fields = verb_utils.getFieldsFromLevel(level)
        group_fields = verb_utils.getGroupFieldsFromLevel(level)
        where = verb_utils.getWhereClauseFromGroupTaxonArray([taxon], false)
        
        q_aux = q_aux.toString().replace(/{index:raw}/g, index)
        q_aux = q_aux.toString().replace(/{biotic:raw}/g, 'false')
        q_aux = q_aux.toString().replace(/{fields:raw}/g, fields)
        q_aux = q_aux.toString().replace(/{res_cells:raw}/g, res_cells)
        q_aux = q_aux.toString().replace(/{res_views:raw}/g, res_views)
        q_aux = q_aux.toString().replace(/{where_filter:raw}/g, where)
        q_aux = q_aux.toString().replace(/{region:raw}/g, region)

        q_select = q_select.toString().replace(/{index:raw}/g, index)
        q_select = q_select.toString().replace(/{fields:raw}/g, fields)
        q_select = q_select.toString().replace(/{group_fields:raw}/g, group_fields)
        q_select = q_select.toString().replace(/type/g, 'type::varchar')
        q_select = q_select.toString().replace(/bid/g, 'bid::varchar')
        q_select = q_select.toString().replace(/icat/g, 'icat::varchar')

        //debug(q_aux)
        //debug(q_select)

        q = q.toString().replace(/{aux:raw}/g, q_aux + ' {aux:raw}')
        q = q.toString().replace(/{union:raw}/g, q_select + ' {union:raw}')

      }

    }

  })
  
  query = query.toString().replace(/{label:raw}/g, label)
  query = query.toString().replace(/{query:raw}/g, q)
  query = query.toString().replace(/{aux:raw}/g, '')
  query = query.toString().replace(/{union:raw}/g, '')

  //debug(query)
  return query
}

module.exports = verb_utils
