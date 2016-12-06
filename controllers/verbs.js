/**
* Verbs module
* @module controllers/verbs
*/
var debug = require('debug')('verbs')
var pgp = require('pg-promise')()
var moment = require('moment')

var config = require('../config.js')
var queries = require('./sql/queryProvider.js')

var pool = pgp(config.db)

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
  
  console.log("getSpeciesByName");

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

  console.log("infoSpecie");

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

  console.log("getStates");

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

  console.log("getUserReg");
  
  var user_email = getParam(req, 'email');

  pool.any(queries.users.getUser, {email: user_email})
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
 * COMMENT: Como aplciar el next cuando existen diferentes variables
 */


exports.getBasicGeoRel = function (req, res, next) {

  console.log("getGeoRel");

  
  var id              = getParam(req, 'id');
  var discardedids    = getParam(req, 'discardedids');
  var tfilters        = getParam(req, 'tfilters');
  var lim_inf   = getParam(req, 'lim_inf');
  var lim_sup   = getParam(req, 'lim_sup');


  var alpha = 0.01;
  var N = 6473;
  

  // var idreg     = getParam(req, 'idreg');
  // var idtime    = getParam(req, 'idtime');
  // var apriori   = getParam(req, 'apriori');
  // var min_occ   = getParam(req, 'min_occ');
  // var mapa_prob = getParam(req, 'mapa_prob');
  // var sfecha    = getParam(req, 'sfecha');

  // if (discardedids) {

      pool.any(queries.users.getUser, {
        id: id,
        N: N,
        alpha: alpha,
        tfilters: tfilters,







      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        next(error)
      })

  // }
  // else{
  //   next()
  // }

    
}








