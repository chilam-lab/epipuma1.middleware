/**
* Verbs module
* @module controllers/verbs
*/
var debug = require('debug')('verbs:old')
var pgp = require('pg-promise')()
var moment = require('moment')
var verb_utils = require('./verb_utils')

var config = require('../config.js')
var queries = require('./sql/queryProvider.js')

var path = require('path')
var fs = require("fs")

var pool = pgp(config.db)

// var N = 14707
var N = 94544; // MX y EU sin alaska y hawuaii 16km
// var N = 19968

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
var getParam = function (req, name, defaultValue) {
  var body = req.body || {}
  var query = req.query || {}

  if (body[name] != null) return body[name]
  if (query[name] != null) return query[name]

  return defaultValue
}



/**
 * GetGridIds de SNIB DB
 *
 * Responde los valores de los ids de las celdas donde se calculan
 * los indices.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getGridIds = function (req, res, next) {
  pool.any(queries.grid.getIds)
    .then(function (data) {
      res.json({'data': data})
    })
    .catch(function (error) {
      next(error)
    })

}

/**
 * getGroupByName regresa los taxones asociados a la cadena `q` en el
 * nivel `field`.
 *
 * Responde los taxones realcionados a la cadena `q` en el nivel 
 * taxonomico `field`.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getGroupsByName = function (req, res, next) {
  var query_name = getParam(req, 'q', '')
  var field = getParam(req, 'field')
  var parent_field = getParam(req, 'parentfield', 'reinovalido')
  var parent_field_value = getParam(req, 'parentvalue', '')
  var limit = getParam(req, 'limit', 20)

  if (field) {
    pool.any(queries.specie.getFieldByName, {
      field: field,
      query_name: '^' + query_name,
      parentfield: parent_field,
      parent_name: '^' + parent_field_value,
      limit: limit}
      )
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        next(error)
      })
  } else {
    next()
  }
}

/**
 * getSpeciesByName regresa la clasificación de las especies relacionadas
 * a la cadena `q`
 * Responde la clasificación de las especies que están relacionadas con
 * una cadena enviada, `nom_sp`. Además se acepta el parámetro `limit`.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getSpeciesByName = function (req, res, next) {
  
  var specie_name = getParam(req, 'q')
  var limit = getParam(req, 'limit', 20)

  if (specie_name) {

    pool.any(queries.specie.getByName, { query_name: '^' + specie_name, 
      limit: limit})
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        next(error)
      })
  } else {
    next()
  }
}

/**
 * getSpecies regresa la clasificación de un número determinado de especies.
 *
 * Responde la clasificación de un número determinado, `limit`, de especies.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getSpecies = function (req, res, next) {
  var limit = getParam(req, 'limit', 20)
  pool.any(queries.specie.getAll, {limit: limit})
    .then(function (data) {
      res.json({'data': data})
    })
    .catch(function (error) {
      next(error)
    })
}

/**
 * infoSpecie regresa GeoJson con las coordenadas de las ocurrencias de la
 * especie además de información adicional sobre la información de las
 * observaciones.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.infoSpecie = function (req, res, next) {

  var specie_id = req.params.specieId
  debug(specie_id)
  var fecha_incio = moment(getParam(req, 'fechaincio', '1500'),
                           ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var fecha_fin = moment(getParam(req, 'fechafin', Date.now()),
                         ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
  var sin_fecha = Number(getParam(req, 'sfecha', 1))

  pool.any(queries.specie.getInfo, {spid: specie_id})
    .then(function (data) {
      data.map(function (e) {
        e.json_geom = JSON.parse(e.json_geom)
        // Filtrado de fecha
        var fechacolecta = moment(e.fechacolecta,
                                  ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
        if (fechacolecta.isBetween(fecha_incio, fecha_fin)) {
          e.discarded = 0
        } else if (sin_fecha && !(fechacolecta.isValid())) {
          e.discarded = 0
        } else {
          e.discarded = 1
        }
      })
      res.json({'data': data})
    })
    .catch(function (error) {
      next(error)
    })
}

/**
 * getCountGridid regresa el conteo por celda de un conjunto de especies
 * definidas por el cliente
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getCountGridid = function (req, res, next) {
  var speciesIdArray = getParam(req, 'cat_spids', [])

  pool.any(queries.interaction.getCount, {spid_array: speciesIdArray})
    .then(function (data) {
      res.json({'data': data})
    })
    .catch(function (error) {
      next(error)
    })
}

/**
 * getCountByGroup obtiene las especies que están relacionadas con una 
 * categoría taxonómica seleccionada y la cadena enviada por el cliente
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getCountByGroup = function (req, res, next) {
  var taxonomicLevel = getParam(req, 'field', 'reinovalido')
  var taxonomicParent = getParam(req, 'parentfield', 'dominio')
  var taxnomicParentName = getParam(req, 'parentitem', 'Eukaryota')

  pool.any(queries.snibinfo.getCountByGroup, 
    {field: taxonomicLevel, parentfield: taxonomicParent, 
      parentitem: taxnomicParentName})
    .then(function (data) {
      res.json({'data': data})
    })
  .catch(function (error) {
    next(error)
  })
}

/**
 * getClimaLayer obtiene la infomación sobre la capa climática requerida
 * por `layer`
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 * 
 */
exports.getClimaLayer = function (req, res, next) {
  var variableType = req.params.type
  var layerName = req.params.layer
  debug('LayerName: '+layerName)
  debug('VariableType: '+variableType)
  if (variableType.toUpperCase() == 'clima'.toUpperCase()){
    if (layerName.length !== 0){
      pool.any(queries.rasters.getClimaLayer, {layername: layerName})
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          next(error)
        })
    } else {
      next()
    }
  } else {
    next()
  }
}

/**
 * getTopoLayer obtiene la infomación sobre la capa climática requerida
 * por `layer`
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 * 
 */
exports.getTopoLayer = function (req, res, next) {
  var variableType = req.params.type
  var layerName = req.params.layer
  if (variableType.toUpperCase() == 'topo'.toUpperCase()){
    if (layerName.length !== 0){
      pool.any(queries.rasters.getTopoLayer, {layername: layerName})
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          next(error)
        })
    } else {
      next()
    }
  } else {
    next()
  }
}

/**
 * getClimaVars obtiene las capas raster disponibles de las varaibles
 * climaticas
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 * 
 */
exports.getClimaVars = function (req, res, next) {
  var variableType = req.params.type
  if (variableType.toUpperCase() == 'clima'.toUpperCase()){
    pool.any(queries.rasters.getClimaVariables)
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        next(error)
      })
  } else {
    next()
  }
}

/**
 * getTopoVars obtiene las capas raster disponibles de las varaibles
 * topográficas
 * 
 * @param {express.Request} req
 * @param {express.Response} res
 * 
 */
exports.getTopoVars = function (req, res, next) {
  var variableType = req.params.type
  if (variableType.toUpperCase() == 'topo'.toUpperCase()){
    pool.any(queries.rasters.getTopoVariables)
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        next(error)
      })
  } else {
    next()
  }
}



/**
 * getStates de SNIB DB
 *
 * Regresa un geojson de lso estados de la republica mexicana.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getStates = function (req, res, next) {

  // debug("getStates")

  pool.any(queries.layers.getStatesMX)
    .then(function (data) {
      res.json({'data': data})
    })
    .catch(function (error) {
      next(error)
    })
}


/**
 * getUserReg de SNIB DB
 *
 * Verifica si existe el usuario por medio de su email
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getUserReg = function (req, res, next) {

  // debug("getUserReg")
  
  var user_email = getParam(req, 'email')

  pool.any(queries.users.getUser, {email: user_email})
    .then(function (data) {
      res.json({'data': data})
    })
    .catch(function (error) {
      next(error)
    })
}

/**************************************************************************************************************************/
/**************************************************************************************************************************/
/**************************************************************************************************************************/
/************************************************************* VERBOS PARA EL NUEVO SERVIDOR ******************************/


/******************************************************************** getGeoRelNiche */


/**
 *
 * Servidor Niche: getGeoRelNiche_VT de SNIB DB, con validación y tiempo
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRelNiche_VT = function (req, res, next) {

    debug("getGeoRelNiche_VT")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var discardedids    = getParam(req, 'discardedids', [])
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false)
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var discardedFilterids = getParam(req, 'discardedDateFilterids')
    // debug(discardedFilterids)

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);
    // debug(discardedFilterids)


    

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("V")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getGeoRelNiche.getGeoRelVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
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
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

        var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
        debug(caso)


        debug("B")
        var whereVar = verb_utils.processBioFilters(tfilters, spid)
        // debug(whereVar)

        pool.any(queries.getGeoRelNiche.getGeoRelBioVT, {
          spid: spid,
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config: whereVar,
          arg_gridids: discardedids,
          lim_inf: fecha_incio.format("YYYY"),
          lim_sup: fecha_fin.format("YYYY"),
          caso: caso,
          res_celda: res_celda,
        res_grid: res_grid,
        discardedDeleted: discardedDeleted
        })
        .then(function (data) {
          // debug(data.length)
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getGeoRelNiche.getGeoRelRaVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
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
 * Servidor Niche: getGeoRelNiche_V de SNIB DB, con validación
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRelNiche_V = function (req, res, next) {

    debug("getGeoRelNiche_V")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var discardedids    = getParam(req, 'discardedids', [])

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);
    // debug(discardedFilterids)

    // debug(discardedids)

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("V")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getGeoRelNiche.getGeoRelV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
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
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("B")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)

      pool.any(queries.getGeoRelNiche.getGeoRelBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids,
        res_celda: res_celda,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        // debug(data.length)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getGeoRelNiche.getGeoRelRaV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
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
 * Servidor Niche: getGeoRelNiche_T de SNIB DB, con tiempo
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRelNiche_T = function (req, res, next) {

    debug("getGeoRelNiche_T")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false)
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    
    var discardedFilterids = getParam(req, 'discardedDateFilterids')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);
    // debug(discardedFilterids)
    

    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid)
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getGeoRelNiche.getGeoRelT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      debug("B")

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)
      
      pool.any(queries.getGeoRelNiche.getGeoRelBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("Ra")

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getGeoRelNiche.getGeoRelRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
 * Servidor Niche: getGeoRelNiche de SNIB DB, sin filtros
 *
 * Obtiene epsilon y score de la elación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRelNiche = function (req, res, next) {

    debug("getGeoRelNiche YEAH!!")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables

    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);
    // console.log(discardedDeleted);

    

    // console.log(hasBios);
    // console.log(hasRaster);
    // console.log(spid);
    // console.log(tfilters);
    // console.log(min_occ);

    
    
    if (hasBios === 'true' && hasRaster === 'true' ){

      debug("T")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getGeoRelNiche.getGeoRel, {
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

      debug("B GeoRel")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)
      // debug(queries.getGeoRelNiche.getGeoRelBio)

      pool.any(queries.getGeoRelNiche.getGeoRelBio, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        res_celda: res_celda,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        debug(data)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
    } 
    else if (hasRaster === 'true'){

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getGeoRelNiche.getGeoRelRaster, {
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





/******************************************************************** getFreqNiche */






/**
 *
 * Servidor Niche: getFreqNiche_VT de SNIB DB, con validación y tiempo
 *
 * Obtiene frecuencia de epsilon y score por especie
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqNiche_VT = function (req, res, next) {

    debug("getFreqNiche_VT")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var discardedids    = getParam(req, 'discardedids', [])

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false)
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var discardedFilterids = getParam(req, 'discardedDateFilterids')
    // debug(discardedFilterids)

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("V")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getFreqNiche.getFreqVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
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
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

        var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
        debug(caso)


        debug("B")
        var whereVar = verb_utils.processBioFilters(tfilters, spid)
        // debug(whereVar)

        pool.any(queries.getFreqNiche.getFreqBioVT, {
          spid: spid,
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config: whereVar,
          arg_gridids: discardedids,
          lim_inf: fecha_incio.format("YYYY"),
          lim_sup: fecha_fin.format("YYYY"),
          caso: caso,
          res_celda: res_celda,
          res_grid: res_grid,
          discardedDeleted: discardedDeleted
        })
        .then(function (data) {
          // debug(data.length)
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getFreqNiche.getFreqRaVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
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
 * Servidor Niche: getFreqNiche_V de SNIB DB, con validación
 *
 * Obtiene frecuencia de epsilon y score por especie
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqNiche_V = function (req, res, next) {

    debug("getFreqNiche_V")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var discardedids    = getParam(req, 'discardedids', [])

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // debug(discardedids)

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("V")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getFreqNiche.getFreqV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
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
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("B")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)

      pool.any(queries.getFreqNiche.getFreqBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids,
        res_celda: res_celda,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        // debug(data.length)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getFreqNiche.getFreqRasterV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
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
 * Servidor Niche: getFreqNiche_T de SNIB DB, con tiempo
 *
 * Obtiene frecuencia de epsilon y score por especie
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqNiche_T = function (req, res, next) {

    debug("getFreqNiche_T")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false)
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var discardedFilterids = getParam(req, 'discardedDateFilterids')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // debug(discardedFilterids)

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid)
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getFreqNiche.getFreqT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      debug("B")

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)
      
      pool.any(queries.getFreqNiche.getFreqBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("Ra")

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getFreqNiche.getFreqRasterT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
 * getFreqNiche de SNIB DB, sin filtros
 *
 * Obtiene frecuencia de epsilon y score por especie
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqNiche = function (req, res, next) {

    debug("getFreqNiche")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      debug("T")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getFreqNiche.getFreq, {
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

      debug("B")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)

      pool.any(queries.getFreqNiche.getFreqBio, {
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

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getFreqNiche.getFreqRaster, {
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





/******************************************************************** getFreqMapNiche */




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

exports.getFreqMapNiche_M = function (req, res, next) {

    debug("getFreqMapNiche_M")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var maxscore    = 700
    var res_celda = getParam(req, 'res_celda', "cells_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var mapa_prob       = getParam(req, 'mapa_prob')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);
    
    if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

        debug("TM")

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

      debug("BM")
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

      debug("RaM")

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      console.log(queries.getFreqMapNiche.getFreqMapRaM);

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


exports.getFreqMapNiche_A = function (req, res, next) {

    debug("getFreqMapNiche_A")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var apriori         = getParam(req, 'apriori')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

        debug("TA")

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

      debug("BA")

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

      debug("RaA")

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

exports.getFreqMapNiche_T = function (req, res, next) {

    debug("getFreqMapNiche_T")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")


    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false)
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var discardedFilterids = getParam(req, 'discardedDateFilterids')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // debug(discardedFilterids)

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      // debug(caso)


      debug("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid)
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getFreqMapNiche.getFreqMapT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      debug("B")

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
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      // debug(caso)


      debug("Ra")

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getFreqMapNiche.getFreqMapRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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

exports.getFreqMapNiche = function (req, res, next) {

    debug("getFreqMapNiche")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    // var N           = 14707; // Verificar N, que se esta contemplando


    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);
    // console.log(discardedDeleted);


    // var download       = getParam(req, 'download', false)
    // if(download){

    //     debug("download");  

    //     var mail    = getParam(req, 'mail')
    //     var ftype   = getParam(req, 'ftype')
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

      debug("T")
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

      debug("B")
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

      debug("Ra")
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






/******************************************************************** getFreqCeldaNiche */






/**
 *
 * getFreqCeldaNiche_A de SNIB DB, apriori
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin utilzar filtros
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqCeldaNiche_A = function (req, res, next) {

    debug("getFreqCeldaNiche_A")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);


    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var apriori         = getParam(req, 'apriori')

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

        debug("TA")

        var whereVar = verb_utils.processBioFilters(tfilters, spid)
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

            pool.any(queries.getFreqCeldaNiche.getFreqCeldaA, {
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

      debug("BA")

      var whereVar = verb_utils.processBioFilters(tfilters, spid)

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioA, {
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

      debug("RaA")

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

          pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaA, {
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
 * Servidor Niche: getFreqCeldaNiche_V de SNIB DB, con validación
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin utilzar filtros
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqCeldaNiche_V = function (req, res, next) {

    debug("getFreqCeldaNiche_V")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var discardedids    = getParam(req, 'discardedids', [])

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // debug(discardedids)

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("V")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
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
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("B")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids,
        res_celda: res_celda,
        res_grid: res_grid,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        // debug(data.length)
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids,
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
 * Servidor Niche: getFreqCeldaNiche_T de SNIB DB, con tiempo
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin utilzar filtros
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqCeldaNiche_T = function (req, res, next) {

    debug("getFreqCeldaNiche_T")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false)
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var discardedFilterids = getParam(req, 'discardedDateFilterids')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // debug(discardedFilterids)

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid)
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getFreqCeldaNiche.getFreqCeldaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      debug("B")

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)
      
      pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("Ra")

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
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
 * getFreqCeldaNiche de SNIB DB, sin filtros
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin utilzar filtros
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqCeldaNiche = function (req, res, next) {

    debug("getFreqCeldaNiche")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      debug("T")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getFreqCeldaNiche.getFreqCelda, {
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
    else if (hasBios === 'true'){

      debug("B")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaBio, {
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
    else if (hasRaster === 'true'){

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaster, {
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




/******************************************************************** getScoreDecilNiche */



/**
 *
 * getScoreDecilNiche_A de SNIB DB, apriori
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecilNiche_A = function (req, res, next) {

    debug("getScoreDecilNiche_A")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var apriori         = getParam(req, 'apriori')

    var groupid        = getParam(req, 'groupid')

    var title_valor = verb_utils.processTitleGroup(groupid, tfilters)

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

        debug("TA")

        var whereVar = verb_utils.processBioFilters(tfilters, spid)
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

            pool.any(queries.getScoreDecilNiche.getScoreDecilA, {
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
                for(i = 0; i < data.length; i++){
                  item = data[i]
                  item["title"] = title_valor
                }
                res.json({'data': data})
            })
            .catch(function (error) {
                debug(error)
                next(error)
        })

      
    }
    else if (hasBios === 'true' && apriori === 'apriori' ){

      debug("BA")

      var whereVar = verb_utils.processBioFilters(tfilters, spid)

      pool.any(queries.getScoreDecilNiche.getScoreDecilBioA, {
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
        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' ){

      debug("RaA")

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

          pool.any(queries.getScoreDecilNiche.getScoreDecilRaA, {
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
              for(i = 0; i < data.length; i++){
                  item = data[i]
                  item["title"] = title_valor
              }
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
 * getScoreDecilNiche_V de SNIB DB, validacion
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getScoreDecilNiche_V = function (req, res, next) {

    debug("getScoreDecilNiche_V")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)
    var groupid        = getParam(req, 'groupid')

    var title_valor = verb_utils.processTitleGroup(groupid, tfilters)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var discardedids    = getParam(req, 'discardedids', [])

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // debug(discardedids)

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("V")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getScoreDecilNiche.getScoreDecilV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString(),
        res_celda: res_celda,
        res_grid: res_grid,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

      
    }
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("B")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)

      pool.any(queries.getScoreDecilNiche.getScoreDecilBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString(),
        res_celda: res_celda,
        res_grid: res_grid,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getScoreDecilNiche.getScoreDecilRaV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString(),
        res_celda: res_celda,
        res_grid: res_grid,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }
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
 * getScoreDecilNiche_T de SNIB DB, sin filtros
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecilNiche_T = function (req, res, next) {

    debug("getScoreDecilNiche_T")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var groupid        = getParam(req, 'groupid')

    var title_valor = verb_utils.processTitleGroup(groupid, tfilters)
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false)
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var discardedFilterids = getParam(req, 'discardedDateFilterids')
    // debug(discardedFilterids)

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid)
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getScoreDecilNiche.getScoreDecilT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
        res_celda: res_celda,
        res_grid: res_grid,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

     
      

    }
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      debug("B")

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)
      
      pool.any(queries.getScoreDecilNiche.getScoreDecilBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
        res_celda: res_celda,
        res_grid: res_grid,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })
      

      
    } 
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      debug(caso)


      debug("Ra")

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getScoreDecilNiche.getScoreDecilRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
        res_celda: res_celda,
        res_grid: res_grid,
        discardedDeleted: discardedDeleted
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }
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
 * getScoreDecilNiche de SNIB DB, sin filtros
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecilNiche = function (req, res, next) {

    debug("getScoreDecilNiche")


    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')
    var groupid        = getParam(req, 'groupid')

    var title_valor = verb_utils.processTitleGroup(groupid, tfilters)

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      debug("T")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

      pool.any(queries.getScoreDecilNiche.getScoreDecil, {
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

        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

      
    }
    else if (hasBios === 'true'){

      debug("B")
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      // debug(whereVar)

      pool.any(queries.getScoreDecilNiche.getScoreDecilBio, {
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

        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        debug(error)
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      // debug(whereVarRaster)

      pool.any(queries.getScoreDecilNiche.getScoreDecilRaster, {
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

        for(i = 0; i < data.length; i++){
          item = data[i]
          item["title"] = title_valor
        }

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





/******************************************************************** getGridSpeciesNiche */



/**
 *
 * getGridSpeciesNiche_M de SNIB DB, con mapa prob
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpeciesNiche_M = function (req, res, next) {

    debug("getGridSpeciesNiche_M")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var maxscore    = 700
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios     = getParam(req, 'hasBios')
    var hasRaster   = getParam(req, 'hasRaster')
    var lat         = getParam(req, 'lat')
    var long        = getParam(req, 'long')

    var mapa_prob       = getParam(req, 'mapa_prob')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    
    if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

      debug("T")

      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)
      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
    else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ){

      debug("B")

      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)

      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
    else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)

      pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
 * getGridSpeciesNiche_A de SNIB DB, apriori
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpeciesNiche_A = function (req, res, next) {

    debug("getGridSpeciesNiche_A")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var maxscore    = 700
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios     = getParam(req, 'hasBios')
    var hasRaster   = getParam(req, 'hasRaster')
    var lat         = getParam(req, 'lat')
    var long        = getParam(req, 'long')
    var apriori     = getParam(req, 'apriori')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

      debug("T")

      var whereVar  = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)
      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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

      debug("B")

      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)

      pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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

      debug("Ra")
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)

      pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
 * getGridSpeciesNiche_T de SNIB DB
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGridSpeciesNiche_T = function (req, res, next) {

    debug("getGridSpeciesNiche_T")

    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707; // Verificar N, que se esta contemplando
    var maxscore    = 700
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios         = getParam(req, 'hasBios')
    var hasRaster       = getParam(req, 'hasRaster')

    var lat      = getParam(req, 'lat')
    var long      = getParam(req, 'long')
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false)
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
    var discardedFilterids = getParam(req, 'discardedDateFilterids')

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // debug(discardedFilterids)

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      // debug(caso)


      debug("T");  

       var whereVar = verb_utils.processBioFilters(tfilters, spid)
       var whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
       var categorias = verb_utils.getRasterCategories(tfilters)
      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      debug("B")

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)
      
      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha)
      var categorias = verb_utils.getRasterCategories(tfilters)


      debug("Ra")

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid)
      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
 * getGridSpeciesNiche de SNIB DB
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpeciesNiche = function (req, res, next) {

    debug("getGridSpeciesNiche")

    
    var spid        = parseInt(getParam(req, 'id'))
    var tfilters    = getParam(req, 'tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var maxscore    = 700
    var res_celda = getParam(req, 'res_celda', "cells_16km")
    var res_grid = getParam(req, 'res_grid', "gridid_16km")

    var discardedDeleted = getParam(req, 'discardedFilterids',[]);

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0)

    // variables configurables
    var hasBios     = getParam(req, 'hasBios')
    var hasRaster   = getParam(req, 'hasRaster')

    var lat      = getParam(req, 'lat')
    var long      = getParam(req, 'long')

    // debug(idGrid)
    // var groupid        = getParam(req, 'groupid')
    // var title_valor = verb_utils.processTitleGroup(groupid, tfilters)
    
    if (hasBios === 'true' && hasRaster === 'true'){

      debug("T")
      
      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)

      // debug(categorias)

      pool.any(queries.getGridSpeciesNiche.getGridSpecies, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
    else if (hasBios === 'true'){

      debug("B")

      var whereVar = verb_utils.processBioFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)
      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesBio, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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
    else if (hasRaster === 'true'){

      debug("Ra")

      // debug(tfilters)

      
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)
      var categorias = verb_utils.getRasterCategories(tfilters)
      
      // debug(whereVarRaster)

      pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaster, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore,
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




/************************************************************* VERBOS PARA REDES ******************************/




/**
 *
 * Servidor Niche: getEdgesNiche
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getEdgesNiche = function (req, res, next) {

  
    debug("getEdgesNiche")

    // var spids = getParam(req, 'spids')
    var sfilters    = getParam(req, 's_tfilters')
    var tfilters    = getParam(req, 't_tfilters')
    var alpha       = 0.01
    // var N           = 14707
    var min_occ       = getParam(req, 'min_occ', 0)
    var res_celda = getParam(req, 'res_celda', "cells_16km")


    var min_ep = 0.0
    var max_edges = 1000

    var hasBiosSource    = getParam(req, 'hasbiosource')
    var hasRasterSource    = getParam(req, 'hasrastersource')
    var hasBiosTarget    = getParam(req, 'hasbiotarget')
    var hasRasterTarget    = getParam(req, 'hasrastertarget')



    if ( hasBiosSource === true && hasBiosTarget === true && hasRasterSource === true && hasRasterTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

        pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterSource === true && hasBiosTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          res_celda: res_celda
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterSource === true && hasRasterTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        
        pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasBiosTarget === true && hasRasterTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)



        pool.any(queries.getEdgesNiche.getEdgesNicheBio_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasBiosTarget === true && hasRasterTarget === true ){

        debug("T")
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)



        pool.any(queries.getEdgesNiche.getEdgesNicheRaster_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasBiosTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        pool.any(queries.getEdgesNiche.getEdgesNicheBio_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          res_celda: res_celda,
          res_celda: res_celda
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)
        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        
        pool.any(queries.getEdgesNiche.getEdgesNicheBio_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasBiosTarget === true ){

        debug("T")
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

        pool.any(queries.getEdgesNiche.getEdgesNicheRaster_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          res_celda: res_celda
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasRasterTarget === true ){

        debug("T")
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        pool.any(queries.getEdgesNiche.getEdgesNicheRaster_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
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
 * Servidor Niche: getNodesNiche
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getNodesNiche = function (req, res, next) {

  
    debug("getNodesNiche")

    
    var sfilters    = getParam(req, 's_tfilters')
    // debug(sfilters)
    var tfilters    = getParam(req, 't_tfilters')
    // debug(tfilters)
    var min_occ     = getParam(req, 'min_occ', 0)
    var res_celda = getParam(req, 'res_celda', "cells_16km")


    var alpha       = 0.01
    // var N           = 14707
    var min_ep      = 0.0
    var max_edges   = 1000


    var hasBiosSource    = getParam(req, 'hasbiosource')
    var hasRasterSource    = getParam(req, 'hasrastersource')
    var hasBiosTarget    = getParam(req, 'hasbiotarget')
    var hasRasterTarget    = getParam(req, 'hasrastertarget')

    // debug(hasBiosSource)
    // debug(hasRasterSource)
    // debug(hasBiosTarget)
    // debug(hasRasterTarget)

    // debug("validaciones")
    // debug(hasBiosSource === true)
    // debug(hasBiosTarget === true)
    // debug(hasRasterSource === true)
    // debug(hasRasterTarget === true)


    if ( hasBiosSource === true && hasBiosTarget === true && hasRasterSource === true && hasRasterTarget === true ){

        debug("hasBiosSource - hasBiosTarget - hasRasterSource - hasRasterTarget")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        pool.any(queries.getNodesNiche.getNodesNicheBioRaster_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterSource === true && hasBiosTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        pool.any(queries.getNodesNiche.getNodesNicheBioRaster_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          res_celda: res_celda
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterSource === true && hasRasterTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        pool.any(queries.getNodesNiche.getNodesNicheBioRaster_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasBiosTarget === true && hasRasterTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        pool.any(queries.getNodesNiche.getNodesNicheBio_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasBiosTarget === true && hasRasterTarget === true ){

        debug("T")
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

        pool.any(queries.getNodesNiche.getNodesNicheRaster_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasBiosTarget === true ){

        debug("hasBiosSource - hasBiosTarget")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)


        debug(whereVarSource)
        debug(whereVarTarget)


        pool.any(queries.getNodesNiche.getNodesNicheBio_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          res_celda: res_celda
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterTarget === true ){

        debug("T")
        var whereVarSource = verb_utils.processBioFilters(sfilters)
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)
        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

        pool.any(queries.getNodesNiche.getNodesNicheBio_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasBiosTarget === true ){

        debug("T")
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        var whereVarTarget = verb_utils.processBioFilters(tfilters)
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

        pool.any(queries.getNodesNiche.getNodesNicheRaster_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          res_celda: res_celda
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          debug(error)
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasRasterTarget === true ){

        debug("T")
        // var whereVarSource = verb_utils.processBioFilters(sfilters)
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters)

        // var whereVarTarget = verb_utils.processBioFilters(tfilters)
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters)

        pool.any(queries.getNodesNiche.getNodesNicheRaster_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster,
          res_celda: res_celda
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



/******************************************************************** UTILS Niche */


/**
 *
 * Servidor Niche: getGridGeoJsonNiche
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getGridGeoJsonNiche = function (req, res, next) {

  if(getParam(req, 'qtype') === "getGridGeoJsonMX"){

      debug(getParam(req, 'qtype'))
      debug("getGridGeoJson")

      try {
          // var filePath = path.join(__dirname, "../geofiles/niche/MX_cells.json");
          var filePath = path.join(__dirname, "../geofiles/niche/gridQGIS_nueva.json");
          debug(filePath);

          var stat = fs.statSync(filePath);
          debug(stat.size);

      }
      catch (e) {
          debug(e)
          next(error)
      }
      

      res.writeHead(200, {
          'Content-Type': 'text/plain',
          'Content-Length': stat.size
      });

      var readStream = fs.createReadStream(filePath);
      // We replaced all the event handlers with a simple call to readStream.pipe()
      readStream.pipe(res);


  }
  else{
      next()
  }

}




/**
 *
 * Servidor Niche: getVariablesNiche
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getVariablesNiche = function (req, res, next) {

  if(getParam(req, 'qtype') === "getVariables"){

      debug(getParam(req, 'qtype'))
      // debug("getVariablesNiche")

      
      var field = getParam(req, 'field',"")
      var parentfield = getParam(req, 'parentfield',"")
      var parentitem = getParam(req, 'parentitem',"")

      debug(field)
      debug(parentfield)
      debug(parentitem)

      

      if(field === "reinovalido"){

          debug("entra reino")

          pool.any(queries.getVariablesNiche.getVariablesReino, {
            taxon: field
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

          pool.any(queries.getVariablesNiche.getVariables, {
            taxon: field,
            parent_taxon: parentfield,
            parent_valor: parentitem
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

      
      

  }
  else{
      next()
  }

  

}






/**
 *
 * Servidor Niche: getRasterNiche
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getRasterNiche = function (req, res, next) {

  if(getParam(req, 'qtype') === "getRasterVariables"){

      debug(getParam(req, 'qtype'))
      debug("getRasterNiche")

      
      var field = getParam(req, 'field')
      var level = parseInt(getParam(req, 'level', 0))
      var type = parseInt(getParam(req, 'type'))

      debug(level)

      // Si la peticion es de nicho, se requieren los spids
      var coleccion = ""
      if(level == 0){

          pool.any(queries.getRasterNiche.getRasterBios, {})
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

          pool.any(queries.getRasterNiche.getRasterIds, {
            layername: field,
            typename: type
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

      
      

  }
  else{
      next()
  }

  

}




/**
 *
 * Servidor Niche: getCountGridid
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getCountGridid = function (req, res, next) {

  if(getParam(req, 'qtype') === "getCountGridid"){

      debug(getParam(req, 'qtype'))
      debug("getCountGridid")

      var spids = getParam(req, 'spids')
      var isNicho = getParam(req, 'nicho')
      var res_celda = getParam(req, 'res_celda', "cells_16km")
      var res_grid = getParam(req, 'res_grid', "gridid_16km")


      // Si la peticion es de nicho, se requieren los spids
      var coleccion = ""
      if(isNicho === 'true'){

         coleccion = "(animalia || plantae || fungi || protoctista || prokaryotae || bio01 || bio02 || bio03 || bio04 || bio05 || bio06 || bio07 || bio08 ||bio09 || bio10 || bio11 || bio12 || bio13 || bio14 || bio15 || bio16 ||bio17 || bio18 || bio19 ) as spids,";
         // || elevacion || pendiente || topidx

      }

      // debug(spids)

      pool.any(queries.getCountGridid.getCount, {
        spids: spids.toString(),
        coleccion: coleccion,
          res_celda: res_celda,
          res_grid: res_grid
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
 * Servidor Niche: getGrididsNiche
 *
 * Obtiene las variables bioticas que coinciden a una cadena dada
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getGrididsNiche = function (req, res, next) {


  if(getParam(req, 'qtype') === "getGridids"){

      debug(getParam(req, 'qtype'))
      debug("getGrididsNiche")
      var res_celda = getParam(req, 'res_celda', "gridid_16km")

      pool.any(queries.getGrididsNiche.getGridids, {
          res_celda: res_celda
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
 * Servidor Niche: getSpeciesNiche
 *
 * Obtiene las variables bioticas que coinciden a una cadena dada
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getSpeciesNiche = function (req, res, next) {

  if(getParam(req, 'qtype') === "getSpecies"){

      debug(getParam(req, 'qtype'))
      debug("getSpeciesNiche")

      var spid              = parseInt(getParam(req, 'id'))
      var sfecha            = getParam(req, 'sfecha', false)
      var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var res_celda = getParam(req, 'res_celda', "gridid_16km")

      // debug(spid)
      // debug(sfecha)
      // debug(fecha_incio.format('YYYY'))
      // debug(fecha_fin.format('YYYY'))
      // debug(moment().format('YYYY-MM-DD'))


      if( (parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ) && sfecha === "false"){
        debug("rango y sin fecha")
        pool.any(queries.getSpeciesNiche.getSpeciesSDR, {
                spid: spid,
                lim_inf: fecha_incio.format('YYYY'),
                lim_sup: fecha_fin.format('YYYY'),
                res_celda: res_celda
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
      else if( parseInt(fecha_incio.format('YYYY')) == 1500 && parseInt(fecha_fin.format('YYYY')) == parseInt(moment().format('YYYY'))  && sfecha === "false"){
          debug("solo sin fecha")
          pool.any(queries.getSpeciesNiche.getSpeciesSD, {
                spid: spid,
                res_celda: res_celda
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
      else if( parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ){
          debug("solo rango")
          pool.any(queries.getSpeciesNiche.getSpeciesR, {
                spid: spid,
                lim_inf: fecha_incio.format('YYYY'),
                lim_sup: fecha_fin.format('YYYY'),
                res_celda: res_celda
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
          debug("sin filtros")
          pool.any(queries.getSpeciesNiche.getSpecies, {
                spid: spid,
                res_celda: res_celda
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
      

  }
  else{

    next()

  }
      
}



/**
 *
 * Servidor Niche: getEntListNiche
 *
 * Obtiene las variables bioticas que coinciden a una cadena dada
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getEntListNiche = function (req, res, next) {
  
  if(getParam(req, 'qtype') === "getEntList"){

      debug(getParam(req, 'qtype'))
      debug("getEntListNiche")

      var str     = getParam(req, 'searchStr')
      var source  = parseInt(getParam(req, 'source'))
      var nivel  = getParam(req, 'nivel')
      var limit   = 15; // numero de resultados a desplegar
       var columnas = verb_utils.getColumns(source, nivel)
       var res_celda = getParam(req, 'res_celda', "gridid_16km")

      debug(nivel)
      debug(str)
      debug(columnas)

      pool.any(queries.getEntListNiche.getEntList, {
            str: str,
            columnas: columnas,
            nivel: nivel,
            res_celda: res_celda
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





/******************************************************************** Código comentado */


/**
 *  NO ES DESPLEGADO EL PROCESO DE VALIDACION EN EL MAPA
 * getFreqMap_V de SNIB DB, con validación
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


/** 
*
* exports.getFreqMap_V = function (req, res, next) {

//     debug("getFreqMap_V")

//     var spid        = parseInt(getParam(req, 'id'))
//     var tfilters    = getParam(req, 'tfilters')
//     var alpha       = 0.01
//     var N           = 6473

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0)

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios')
//     var hasRaster       = getParam(req, 'hasRaster')
//     var discardedids    = getParam(req, 'discardedids', [])
    
//     if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

//       debug("TV")
//       var whereVar = ""
//       if(tfilters.length>0){
//           whereVar = verb_utils.processBioFilters(tfilters, spid)
//           whereVar = whereVar + " and epitetovalido <> '' "
//       }
//       else{
//           whereVar = " epitetovalido <> '' "
//       }
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

//       // pool.any(queries.getFreqCelda.getFreqCeldaV, {
//       //     spid: spid,
//       //     N: N,
//       //     alpha: alpha,
//       //     min_occ: min_occ,
//       //     where_config: whereVar,
//       //     where_config_raster: whereVarRaster,
//       //     arg_gridids: discardedids
//       // })
//       // .then(function (data) {
//       //     res.json({'data': data})
//       // })
//       // .catch(function (error) {
//       //     debug(error)
//       //     next(error)
//       // })

      
//     }
//     else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ){

//       debug("BV")

//       var whereVar = ""
//       if(tfilters.length > 0){
//           whereVar = verb_utils.processBioFilters(tfilters, spid)
//           whereVar = whereVar + " and epitetovalido <> '' "
//       }
//       else{
//           whereVar = " epitetovalido <> '' "
//       }

//       pool.any(queries.getFreqMap.getFreqMapBioV, {
//           spid: spid,
//           N: N,
//           alpha: alpha,
//           min_occ: min_occ,
//           where_config: whereVar,
//           arg_gridids: discardedids
//       })
//       .then(function (data) {
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         debug(error)
//         next(error)
//       })

      
//     } 
//     else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

//       debug("RaV")
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid)

//       // pool.any(queries.getFreqCelda.getFreqCeldaRaV, {
//       //     spid: spid,
//       //     N: N,
//       //     alpha: alpha,
//       //     min_occ: min_occ,
//       //     where_config_raster: whereVarRaster,
//       //     arg_gridids: discardedids
//       // })
//       // .then(function (data) {
//       //     res.json({'data': data})
//       // })
//       // .catch(function (error) {
//       //     debug(error)
//       //     next(error)
//       // })
      
//     } 
//     else{

//       next()
//     }

// };*/












