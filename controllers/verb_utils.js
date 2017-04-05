var debug = require('debug')('verbs:verbsUtils')
var moment = require('moment')

var verbs_utils = {} 

/**
 * Regresa el valor del parametro `name` cuando este presente o `defaultValue`.
 *
 *  - Checks body params, ex: id=12, {"id":12}
 *  - Checks query string params, ex: ?id=12
 *
 * To utilize request bodies, `req.body`
 * should be an object. This can be done by using
 * the `bodyParser()` middleware.
 *
 * @param {express.Request} req
 * @param {string} name
 * @param {Mixed} [defaultValue]
 * @return {string}
 *
 */
verbs_utils.getParam = function (req, name, defaultValue) {
  var body = req.body || {}
  var query = req.query || {}

  if (body[name] != null) return body[name]
  if (query[name] != null) return query[name]

  return defaultValue
}

verbs_utils.processBioFilters = function(tfilters_total, spid){
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
    filter_disj = 'sp_snib.spid <> ' + spid + ' and '
  }

  for (var i = 0; i < tfilters.length; i++) {
    if (first_bio == true) {
			// si existe mas de un elemento deben ir entre parentesis, ej: and (familiavalida = 'Felidae' or familiavalida = 'Canidae')
      if(tfilters.length > 1) {
        whereVar = whereVar + ' where ' + filter_disj + ' (' + tfilters[i].field + ' = \'' + tfilters[i].value + '\''
      } else {
        whereVar = whereVar + ' where ' + filter_disj + tfilters[i].field + ' = \'' + tfilters[i].value + '\''	
      }
      first_bio = false
    } else {
      whereVar = whereVar + ' OR ' + tfilters[i].field + ' = \'' + tfilters[i].value + '\' '
    }
  }
		
  // si existe mas de un elemento deben ir entre parentesis, ej: and (familiavalida = 'Felidae' or familiavalida = 'Canidae')
  if(tfilters.length > 1) {
    whereVar = whereVar + ') '
  }

  return whereVar
}

verbs_utils.processRasterFilters = function(tfilters_total, spid){
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

verbs_utils.processDateRecords = function(lim_inf, lim_sup, sfecha){
  var filterDates = ''
  // debug(lim_inf);
  // debug(lim_sup);
  // debug(sfecha);

  if(lim_inf || sfecha === 'false') {
    filterDates += 'where (snib.especievalidabusqueda = \'\' or snib.especievalidabusqueda is null)  or '
    if(lim_inf) {
      filterDates +=  '(( EXTRACT( EPOCH FROM to_timestamp(fechacolecta, \'YYYY-MM--DD\') ) * 1000 ) < ' + lim_inf + ' ' +
							'or ' + 
							'(EXTRACT(EPOCH FROM to_timestamp(fechacolecta, \'YYYY-MM--DD\')) * 1000) > ' + lim_sup + ' ) '
      if(sfecha === 'false') {
					// debug("Filtros y sin fecha");
					// los valores nulos y vacios de fechacolecta son menores al valor establecido en la condicion de tiempo anteior 
      } else {
				// debug("Solo filtros");
        filterDates += ' and (fechacolecta <> \'\' and fechacolecta is not null)  '
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

verbs_utils.processTitleGroup = function(groupid, tfilters){
  var title_valor = ''

  if(groupid != undefined) {
    // group_item = 0 ->> root
    if (tfilters[0].type == 4) {
      title_valor = JSON.stringify({'title':'Grupo Bio ' + groupid, 'type': tfilters[0].type , 'group_item': tfilters[0].group_item, 'is_parent':true })
    } else if (tfilters[0].type == 0) {
      title_valor = JSON.stringify({'title':'Grupo Abio ' + groupid, 'type': tfilters[0].type , 'group_item': tfilters[0].group_item, 'is_parent':true })
			// title_valor = "Grupo Abio " + groupid;
    } else { // if (tfilters[0].type == 1){
      title_valor = JSON.stringify({'title':'Grupo Topo ' + groupid, 'type': tfilters[0].type , 'group_item': tfilters[0].group_item, 'is_parent':true })
			// title_valor = "Grupo Abio " + groupid;
    }
  } else if (tfilters[0].value) {
    // debug("title: " + tfilters[0].value);
    // debug("title: " + tfilters[0].label);
    // debug(group_item);
    if (tfilters[0].type == 4) {
      title_valor = JSON.stringify({'title':tfilters[0].value, 'type':tfilters[0].type , 'group_item': tfilters[0].group_item, 'is_parent':false })
    } else {
      title_valor = JSON.stringify({'title':tfilters[0].label, 'type':tfilters[0].type , 'group_item': tfilters[0].group_item, 'is_parent':false })
    }
  }
		
  // debug("title_valor: " + title_valor);
  return JSON.parse(title_valor)
}

verbs_utils.getColumns = function(issource, nivel) {
  if(issource == 1) {
    return 'spid, reinovalido, phylumdivisionvalido, clasevalida, ordenvalido, familiavalida, generovalido, especievalidabusqueda'
  } else {
    return 'distinct ' + nivel + ' '
  }
}

verbs_utils.getTimeCase = function(fecha_incio, fecha_fin, sfecha){
  // debug(fecha_incio.format('YYYY'));
  // debug(fecha_fin.format('YYYY'));
  // debug(sfecha);

  var caso

  if( (parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ) && sfecha === 'false') {
    debug('rango y sin fecha')
    caso = 2
  } else if( parseInt(fecha_incio.format('YYYY')) == 1500 && parseInt(fecha_fin.format('YYYY')) == parseInt(moment().format('YYYY'))  && sfecha === 'false') {
    debug('solo sin fecha')
    caso = 1
  } else if( parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ) {
    debug('solo rango')
    caso = 3
  }
  
  // debug(caso);
  return caso

}

verbs_utils.getRasterCategories = function(tfilters_total) {
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
      categorias += 'bio01||bio02||bio03||bio04||bio05||bio06||bio07||bio08||bio09||bio10||bio11||bio12||bio13||bio14||bio15||bio16||bio17||bio18||bio19'
      abio = true
    } else if(tfilters_total[i].type == 2 && topo==false) {
      if(i>0) 
        categorias += '||'
      categorias += 'elevacion||pendiente||topidx'
      topo = true
    } else if(tfilters_total[i].type == 1 && suelo==false) {
      if(i>0) 
        categorias += '||'
      categorias += 'mexca || mexce || mexco || mexk || mexmg || mexmo || mexna || mexph || mexras'
      suelo = true
    }
  }

	// debug(categorias);
  return categorias
}

module.exports = verbs_utils
