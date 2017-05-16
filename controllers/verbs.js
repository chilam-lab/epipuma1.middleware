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

var pool = pgp(config.db)

// var N = 14707
var N = 94544; // MX y EU sin alaska y hawaii 16km
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


/******************************************************************** UTILS Niche */




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












