/**
* Verbs module
* @module controllers/verbs
*/
var debug = require('debug')('verbs:old')
var moment = require('moment')
var verb_utils = require('./verb_utils')

var queries = require('./sql/queryProvider.js')

var path = require('path')
var fs = require("fs")
var jwt = require("jsonwebtoken")

var SEED = require("../config").SEED;
var TIME_TOKEN = require("../config").TIME_TOKEN;

var pool = verb_utils.pool 
var N = verb_utils.N 
var iterations = verb_utils.iterations
var alpha = verb_utils.alpha
var limite = verb_utils.limite
var min_taxon_name = verb_utils.min_taxon_name
var max_taxon_name = verb_utils.max_taxon_name


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
  var parent_field = getParam(req, 'parentfield', max_taxon_name)
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
  var taxonomicLevel = getParam(req, 'field', max_taxon_name)
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







/**************************************************************************************************************************/
/************************************************************* VERBOS PARA EL NUEVO SERVIDOR ******************************/
/******************************************************************** UTILS Niche */


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

      debug("getUserReg")

      var user_email = getParam(req, 'email')
      debug("user_email: " + user_email)

      pool.any(queries.users.getUser, {email: user_email})
        .then(function (data) {
          res.json({
            'data': data,
            ok: true
          })
        })
        .catch(function (error) {
          return res.json({
            err: error,
            ok: false,
            message: "Error al procesar la query"
          })
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
exports.getUserToken = function (req, res, next) {

      debug("getUserToken")
      var user_email = getParam(req, 'email')
      
      pool.any(queries.users.getUser, {email: user_email})
        .then(function (data) {

            var usuario = {
              user: user_email
            }

            var token = jwt.sign({ usuario: usuario }, SEED, { expiresIn: TIME_TOKEN }); // 4 horas
      
            res.json({
              data: data,
              token: token,
              ok: true
            })
        })
        .catch(function (error) {
          return res.json({
            err: error,
            ok: false,
            message: "Error al procesar la query"
          })
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
exports.setUserReg = function (req, res, next) {

    debug("setUserReg")

    var user_email = getParam(req, 'email')
    var user_name = getParam(req, 'usuario')

    pool.any(queries.users.setUserReg, {email: user_email, name: user_name })
      .then(function (data) {
        res.json({
          "data": data,
          "ok": true
        })
      })
      .catch(function (error) {
        
        return  res.json({
          err: error,
          ok: false,
          message: "Error al procesar la query"
        })

      })

}



/**
 *
 * Servidor Niche: getValuesFromToken
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getValuesFromToken = function (req, res, next) {

      debug("getValuesFromToken")

      var tipo = getParam(req, 'tipo')
      var token = getParam(req, 'token')

      // debug("tipo: " + tipo)
      // debug("token: " + token)


      pool.any(queries.getValuesFromToken.getValues, {
          tipo_analisis: tipo,
          token: token
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



/**
 *
 * Servidor Niche: getToken
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getToken = function (req, res, next) {

      debug("getToken")

      var tipo = getParam(req, 'tipo')
      var params = getParam(req, 'confparams')


      pool.any(queries.getToken.setLinkValues, {
          tipo_analisis: tipo,
          params: params
      })
          .then(function (data) {
            res.json({'data': data})
      })
          .catch(function (error) {
            debug(error)
            next(error)
      })

}



/**
 *
 * Servidor Niche: getValidationTables
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.getValidationTables = function (req, res, next) {

      debug("getValidationTables")

      var spid = getParam(req, 'spid')
      var iter = getParam(req, 'iter')
      var idtbl =  "tbl_" + new Date().getTime() //getParam(req, 'idtable')
      var iter = getParam(req, 'iterations',iterations)


      var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
      var res_celda_sp =  "cells_"+grid_resolution+"km"   
      var res_celda_snib =  "gridid_"+grid_resolution+"km" 
      var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 
      
      // var res_celda_sp = verb_utils.getParam(req, 'res_celda_sp', 'cells_16km')
      // var res_celda_snib = verb_utils.getParam(req, 'res_celda_snib', 'gridid_16km')
      // var res_celda_snib_tb = verb_utils.getParam(req, 'res_celda_snib_tb', 'grid_16km_aoi')
      

      pool.any(queries.getValidationTables.createTables, {
          spid: spid,
          iterations: iter,
          idtbl: idtbl,
          res_celda_sp: res_celda_sp,
          res_celda_snib: res_celda_snib,
          res_celda_snib_tb: res_celda_snib_tb
      })
          .then(function (data) {
            
            var item = data[0]
            item['tblname'] = idtbl
            debug(data)
            
            res.json({'data': data})
      })
          .catch(function (error) {
            debug(error)
            next(error)
      })

}



/**
 *
 * Servidor Niche: processValidationTables
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.processValidationTables = function (req, res, next) {

      debug("processValidationTables")

      var idtbl = getParam(req, 'idtable')


      pool.any(queries.processValidationTables.processTables, {
          idtbl: idtbl
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




/**
 *
 * Servidor Niche: processValidationTables
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */
exports.deleteValidationTables = function (req, res, next) {

      debug("deleteValidationTables")
  
      var idtbl = getParam(req, 'idtable','no_table')
      debug("delete idtable: " + idtbl)


      pool.any(queries.deleteValidationTables.deleteTables, {
          idtbl: idtbl
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

    debug('getGridGeoJsonNiche')
    
    var grid_res = getParam(req, 'grid_res',16)
    var footprint_region = parseInt(getParam(req, 'footprint_region', 1))
    
    debug('grid_res: ' + grid_res)
    debug('footprint_region: ' + footprint_region)
    // debug(api)
    // debug(api_file)

    pool.any(queries.grid.gridxxkm, {
      grid_res: grid_res,
      region: footprint_region 
    })
      .then(function(data) {
        
        res.json(data[0].json)
      
      })
      .catch(function(error) {
        debug(error)
        next(error)
      })

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
      
      debug("getVariablesNiche")
      
      var field = getParam(req, 'field',"")
      var parentfield = getParam(req, 'parentfield',"")
      var parentitem = getParam(req, 'parentitem',"")

      // debug(field)
      // debug(parentfield)
      // debug(parentitem)

      if(field === max_taxon_name){

          // debug("entra reino")
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

      debug("getRasterNiche")

      var field = getParam(req, 'field')
      var level = parseInt(getParam(req, 'level', 0))
      var region = parseInt(getParam(req, 'footprint_region', 1))
      var type = parseInt(getParam(req, 'type'))

      // debug(level)
      // Si la peticion es de nicho, se requieren los spids
      // var coleccion = ""

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


exports.getAvailableVariables = function (req, res, next) {

  debug("getAvailableVariables")

  pool.any(queries.getRasterNiche.getAvailableVariables, {})
  .then(function (data) {
        res.json({
          'ok':true,
          'data': data
        })
  })
  .catch(function (error) {
        debug(error)
        next(error)
  })


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

      debug("getSpeciesNiche")

      var spid              = parseInt(getParam(req, 'id'))
      var sfecha            = getParam(req, 'sfecha', false)
      var sfosil            = getParam(req, 'sfosil', false)
      var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
      var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var res_celda = getParam(req, 'res_celda', "gridid_16km")

      var grid_resolution = getParam(req, 'grid_res',16)
      var res_celda_sp =  "cells_"+grid_resolution+"km"   
      var res_celda_snib =  "gridid_"+grid_resolution+"km" 
      var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 
      
      
      // debug(spid)
      // debug(sfecha)
      // debug(sfosil)
      // debug(fecha_incio.format('YYYY'))
      // debug(fecha_fin.format('YYYY'))
      // debug(moment().format('YYYY-MM-DD'))


      if( (parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ) && sfecha === "false"){
        debug("CASO: rango y sin fecha")
        pool.any(queries.getSpeciesNiche.getSpeciesSDR, {
                spid: spid,
                lim_inf: fecha_incio.format('YYYY'),
                lim_sup: fecha_fin.format('YYYY'),
                res_celda: res_celda,
                res_celda_sp: res_celda_sp,
                res_celda_snib: res_celda_snib,
                res_celda_snib_tb: res_celda_snib_tb, 
                sfosil: lb_fosil
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
          debug("CASO: solo sin fecha")
          pool.any(queries.getSpeciesNiche.getSpeciesSD, {
                spid: spid,
                res_celda: res_celda,
                res_celda_sp: res_celda_sp,
                res_celda_snib: res_celda_snib,
                res_celda_snib_tb: res_celda_snib_tb, 
                sfosil: lb_fosil
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
          debug("CASO: solo rango")
          pool.any(queries.getSpeciesNiche.getSpeciesR, {
                spid: spid,
                lim_inf: fecha_incio.format('YYYY'),
                lim_sup: fecha_fin.format('YYYY'),
                res_celda: res_celda,
                res_celda_sp: res_celda_sp,
                res_celda_snib: res_celda_snib,
                res_celda_snib_tb: res_celda_snib_tb, 
                sfosil: lb_fosil
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
          debug("CASO: sin filtros")
          pool.any(queries.getSpeciesNiche.getSpecies, {
                spid: spid,
                res_celda: res_celda,
                res_celda_sp: res_celda_sp,
                res_celda_snib: res_celda_snib,
                res_celda_snib_tb: res_celda_snib_tb, 
                sfosil: lb_fosil
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
  
      debug("getEntListNiche")

      var str       = getParam(req, 'searchStr')
      var has_limit = parseInt(getParam(req, 'limit', false))
      var source    = parseInt(getParam(req, 'source'))
      var nivel     = getParam(req, 'nivel', min_taxon_name)
      var columnas  = verb_utils.getColumns(source, nivel)

      var grid_resolution = getParam(req, 'grid_res',16)
      var res_celda_sp =  "cells_"+grid_resolution+"km"   
      var res_celda_snib =  "gridid_"+grid_resolution+"km" 
      var res_celda_snib_tb = "grid_"+grid_resolution+"km_aoi" 

      res_celda_sp = (source == 1) ? res_celda_sp : "array[]::int[]";
      var val_tree = (source == 1) ? " and icount("+res_celda_sp+") > 0 " : "";

      var txt_limite = has_limit === false ? "" : "limit " + limite
      
      // debug(nivel)
      // debug(str)
      // debug(limite)
      // debug("columnas: " + columnas)
      // debug("res_celda_sp: " + res_celda_sp)
      // debug("val_tree: " + val_tree)

      pool.any(queries.getEntListNiche.getEntList, {
            str: str,
            columnas: columnas,
            nivel: nivel,
            res_celda_sp: res_celda_sp,
            res_celda_snib: res_celda_snib,
            res_celda_snib_tb: res_celda_snib_tb, 
            val_tree: val_tree,
            limite: txt_limite
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


/**
* getSubAOI 
*
* Trae todas las areas de interes en las que es posible hacer los analisis
* 
* @param {express.Request} req
* @param {express.Response} res
*
*/
exports.getSubAOI = function(req, res, next) {

      debug("getSubAOI");

      pool.any(queries.subaoi.getSubAOI)
        .then(function (data) {
          res.json({
            'data': data,
            ok: true
          })
        })
        .catch(function (error) {
          return res.json({
            err: error,
            ok: false,
            message: "Error al procesar la query"
          })
          next(error)
        })
}










