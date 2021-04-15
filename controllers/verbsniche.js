/**
* Verbs module
* @module controllers/verbs
*/
var debug = require('debug')('verbs:niche')
var moment = require('moment')
var verb_utils = require('./verb_utils')
var pgp = require('pg-promise')()

var queries = require('./sql/queryProvider.js')

var jwt = require('jsonwebtoken')

var nodeMailer = require('nodemailer')

var SEED = require('../config').SEED
var TIME_TOKEN = require('../config').TIME_TOKEN
var config = require('../config')
var d3 = require('d3')

var pool = verb_utils.pool
// var N = verb_utils.N
var iterations = verb_utils.iterations
// var alpha = verb_utils.alpha
var limite = verb_utils.limite
var min_taxon_name = verb_utils.min_taxon_name
var max_taxon_name = verb_utils.max_taxon_name
var default_region = verb_utils.region_mx
var default_resolution = verb_utils.covid_mx
var email_config = config.email


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
  pool.any(queries.grid.getIds).then(
    function (data) {
      res.json({'data': data})
    }).catch(
    function (error) {
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

  debug('getUserReg')

  var user_email = getParam(req, 'email')
  debug('user_email: ' + user_email)

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
          message: 'Error al procesar la query'
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

  debug('getUserToken')
  var user_email = getParam(req, 'email')

  pool.any(queries.users.getUser, {email: user_email})
      .then(function (data) {

        var usuario = {
          user: user_email
        }

        var token = jwt.sign({ usuario: usuario }, SEED, { expiresIn: TIME_TOKEN }) // 4 horas

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
          message: 'Error al procesar la query'
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

  debug('setUserReg')

  var user_email = getParam(req, 'email')
  var user_name = getParam(req, 'usuario')

  pool.any(queries.users.setUserReg, {email: user_email, name: user_name })
    .then(function (data) {
      res.json({
        'data': data,
        'ok': true
      })
    })
    .catch(function (error) {

      return  res.json({
        err: error,
        ok: false,
        message: 'Error al procesar la query'
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

  debug('getValuesFromToken')

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

  debug('getToken')

  var sfilters = verb_utils.getParam(req, 'sfilters',[])
  var val_process = getParam(req, 'val_process')
  var val_process_temp = getParam(req, 'val_process_temp')
  
  // var idtabla = getParam(req, 'idtabla')
  var mapa_prob = getParam(req, 'mapa_prob')
  var fossil = getParam(req, 'fossil')
  var apriori = getParam(req, 'apriori')
  var sfecha = getParam(req, 'sfecha')
  var lim_inf = getParam(req, 'lim_inf')
  var lim_sup = getParam(req, 'lim_sup')
  var lim_inf_valtemp = getParam(req, 'lim_inf_valtemp')
  var lim_sup_valtemp = getParam(req, 'lim_sup_valtemp')
  var min_occ = getParam(req, 'min_occ')
  var grid_res = getParam(req, 'grid_res')
  var footprint_region = getParam(req, 'footprint_region')
  var discardedFilterids = getParam(req, 'discardedFilterids',[])
  var tfilters = verb_utils.getParam(req, 'tfilters',[])
  var tipo = verb_utils.getParam(req, 'tipo', 'nicho')

  var link_str = "";

  // link_str += "sp_data=" + JSON.stringify({"spid": spid.toString(), "label":label}) + "&"
  link_str += "chkVal=" + val_process + "&"
  link_str += "chkValTemp=" + val_process_temp + "&"
  // link_str += "idtabla=" + idtabla + "&"
  link_str += "chkPrb=" + mapa_prob + "&"
  link_str += "chkFosil=" + fossil + "&"
  link_str += "chkApr=" + apriori + "&"
  link_str += "chkFec=" + sfecha + "&"
  link_str += lim_inf === undefined ? "" : "minFec=" + lim_inf + "&"
  link_str += lim_sup === undefined ? "" : "maxFec=" + lim_sup + "&"
  link_str += lim_inf_valtemp === undefined ? "" : "minFecVal=" + lim_inf_valtemp + "&"
  link_str += lim_sup_valtemp === undefined ? "" : "maxFecVal=" + lim_sup_valtemp + "&"
  link_str += "chkOcc=" + min_occ + "&"
  link_str += "gridRes=" + grid_res + "&"
  link_str += "region=" + footprint_region + "&"
  link_str += "num_dpoints=" + discardedFilterids.length + "&"

  discardedFilterids.forEach(function (item, index) {
    var str_item = JSON.stringify({feature: { properties: { gridid: item}}});
    if (index === 0) {
        link_str += "deleteditem[" + index + "]=" + str_item;
    } else {
        link_str += "&deleteditem[" + index + "]=" + str_item;
    }
  })
  link_str += discardedFilterids.length > 0 ? "&" : ""


  link_str += "num_sfilters=" + sfilters.length + "&"

  sfilters.forEach(function (item, index) {

      var str_item = JSON.stringify(item);

      if (index == 0) {
           link_str += "sfilters[" + index + "]=" + str_item;
      } else {
           link_str += "&sfilters[" + index + "]=" + str_item;
      }

   });

  link_str += "&"

  link_str += "num_filters=" + tfilters.length + "&"

  tfilters.forEach(function (item, index) {

      var str_item = JSON.stringify(item);

      if (index == 0) {
           link_str += "tfilters[" + index + "]=" + str_item;
      } else {
           link_str += "&tfilters[" + index + "]=" + str_item;
      }

   });

   debug(link_str)
           

    pool.any(queries.getToken.setLinkValues, {
      tipo_analisis: tipo,
      params: link_str
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

  debug('getValidationTables')

  var spid = getParam(req, 'spid')
  var iter = getParam(req, 'iter')
  var idtbl =  'tbl_' + new Date().getTime() //getParam(req, 'idtable')
  var iter = getParam(req, 'iterations',iterations)

  var footprint_region = parseInt(getParam(req, 'footprint_region', default_region))

  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  'cells_'+grid_resolution+'km'
  // var res_celda_snib =  'gridid_'+grid_resolution+'km'
  var res_celda_snib_tb = 'grid_geojson_'+grid_resolution+'km_aoi'

    // var res_celda_sp = verb_utils.getParam(req, 'res_celda_sp', 'cells_16km')
    // var res_celda_snib = verb_utils.getParam(req, 'res_celda_snib', 'gridid_16km')
    // var res_celda_snib_tb = verb_utils.getParam(req, 'res_celda_snib_tb', 'grid_16km_aoi')


  pool.any(queries.getValidationTables.createTables, {
    spid: spid,
    iterations: iter,
    idtbl: idtbl,
    res_celda_sp: res_celda_sp,
    // res_celda_snib: res_celda_snib,
    res_celda_snib_tb: res_celda_snib_tb,
    region: footprint_region
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
* Servidor Niche: getValidationTables
*
*
* @param {express.Request} req
* @param {express.Response} res
*
*/
exports.getGroupValidationTables = function (req, res, next) {

  debug('getValidationTables')

  var target_group = verb_utils.getParam(req, 'target_taxons', [])
  var filter = verb_utils.getWhereClauseFromGroupTaxonArray(target_group, true).replace('WHERE', '')

  filter = filter.replace(new RegExp("\'", 'g'), "\'\'")
  var iter = getParam(req, 'iter')
  
  // debug("filter:" + filter)


  var idtbl =  'tbl_' + new Date().getTime() //getParam(req, 'idtable')
  //var idtbl =  't01'

  //debug(idtbl)
  var iter = getParam(req, 'iterations',iterations)

  var footprint_region = parseInt(getParam(req, 'footprint_region', default_region))

  var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
  var res_celda_sp =  'cells_'+grid_resolution+'km'
  var res_celda_snib_tb = 'grid_geojson_'+grid_resolution+'km_aoi'
  var res_grid_id = 'gridid_'+grid_resolution+'km'

  debug(filter);
  debug(iter);
  debug(idtbl);
  debug(res_celda_sp);
  debug(res_celda_snib_tb);
  debug(footprint_region);
  debug(res_grid_id);
  debug(grid_resolution);

  pool.any(queries.getValidationTables.createGroupTables, {
    filter: filter,
    iterations: iter,
    idtbl: idtbl,
    res_celda_sp: res_celda_sp,
    res_celda_snib_tb: res_celda_snib_tb,
    region: footprint_region,
    grid: res_grid_id,
    resolution: grid_resolution
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

  debug('processValidationTables')

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

  debug('deleteValidationTables')

  var idtbl = getParam(req, 'idtable','no_table')
  debug('delete idtable: ' + idtbl)


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

  var grid_res = getParam(req, 'grid_res', default_resolution)
  var footprint_region = parseInt(getParam(req, 'footprint_region', default_region))

  debug("grid_res: " + grid_res)
  debug("footprint_region: " + footprint_region)

 pool.task(t => {

      return t.one(queries.basicAnalysis.getN, {

          grid_resolution: grid_res,
          footprint_region: footprint_region

      }).then(resp => {

          debug("Valor N: " + resp.n)

          return pool.any(queries.grid.gridxxkm, {

                    // grid_res: parseInt(grid_res),
                    grid_res: grid_res,
                    region: footprint_region
                  })
      })
    })
      .then(data => {

          // debug(data)

          var N = data[0].json['features'].length;
          for(var i = 0; i < N; i++) {
            if(typeof(data[0].json['features'][i]) == 'string'){
              data[0].json['features'][i] = JSON.parse(data[0].json['features'][i]);  
            }
          } 
          res.json(data[0].json)

      })
      .catch(error => {
          debug(error)
          return res.json({
            ok: false,
            error: error
          });
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
      
  debug('getVariablesNiche')

  var field = getParam(req, 'field','')
  var parentfield = getParam(req, 'parentfield','')
  var parentitem = getParam(req, 'parentitem','')
  var grid_res = getParam(req, 'grid_res','mun')

  // debug("field: " + field)
  // debug("parentfield: " + parentfield)
  // debug("parentitem: " + parentitem)

  // Verificar si es necesario enviar el footprint_region, puede existir cambio de region despues 
  // de seleccionar las covariables
  var footprint_region = parseInt(getParam(req, 'footprint_region', default_region))

  var ad_param, order_param = "";
  if(field === "especieepiteto"){
    ad_param = " (generovalido || ' ' || especieepiteto) "
    order_param = " generovalido, especieepiteto "
  } else{
    ad_param = field
    order_param = field
  }

  debug("field: " + field)
  debug("ad_param: " + ad_param)
  debug("order_param: " + order_param)
  debug("parentfield: " + parentfield)
  // debug("parent_valor: " + parentitem)
  debug("parentitem: " + parentitem)

  if(field === max_taxon_name){

        // debug("entra reino")

    const query1 = pgp.as.format(queries.getVariablesNiche.getVariablesReino, {
      taxon: field,
      grid_res: grid_res,
      region:footprint_region
    })
    debug(query1)

    pool.any(queries.getVariablesNiche.getVariablesReino, {
      taxon: field,
      grid_res: grid_res,
      region:footprint_region
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

    const query1 = pgp.as.format(queries.getVariablesNiche.getSpeciesVariables, {
      taxon: field,
      ad_param: ad_param,
      order_param: order_param,
      grid_res: grid_res,
      parent_valor: parentitem,
      region:footprint_region
    })
    debug(query1)

    if( field === 'especievalidabusqueda'){

      pool.any(queries.getVariablesNiche.getSpeciesVariables, {
        taxon: field,
        ad_param: ad_param,
        order_param: order_param,
        grid_res: grid_res,
        parent_valor: parentitem,
        region:footprint_region
      })
          .then(function (data) {
                // debug(data)
            res.json({'data': data})
          })
          .catch(function (error) {
            debug(error)
            next(error)
          })



    }else if(parentfield!=='generovalido'){

      const query1 = pgp.as.format(queries.getVariablesNiche.getVariables, {
        taxon: field,
        ad_param: ad_param,
        order_param: order_param,
        parent_taxon: parentfield,
        grid_res: grid_res,
        parent_valor: parentitem,
        region:footprint_region
      })
      debug(query1)

      pool.any(queries.getVariablesNiche.getVariables, {
        taxon: field,
        ad_param: ad_param,
        order_param: order_param,
        parent_taxon: parentfield,
        grid_res: grid_res,
        parent_valor: parentitem,
        region:footprint_region
      })
          .then(function (data) {
                // debug(data)
            res.json({'data': data})
          })
          .catch(function (error) {
            debug(error)
            next(error)
          })


    } else {

      const query1 = pgp.as.format(queries.getVariablesNiche.getVariablesSpecies, {
        taxon: field,
        ad_param: ad_param,
        order_param: order_param,
        parent_taxon: parentfield,
        parent_valor: parentitem,
        region:footprint_region,
        grid_res: grid_res
      })
      debug(query1)


      pool.any(queries.getVariablesNiche.getVariablesSpecies, {
        taxon: field,
        ad_param: ad_param,
        order_param: order_param,
        parent_taxon: parentfield,
        parent_valor: parentitem,
        region:footprint_region,
        grid_res: grid_res
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

  debug('getRasterNiche')

  var field = getParam(req, 'field', '')
  var level = parseInt(getParam(req, 'level', 0))
  var region = parseInt(getParam(req, 'footprint_region', default_region))
  var type = parseInt(getParam(req, 'type', 1))

  debug('field: ' + field)
  debug('level: ' + level)
  debug('region: ' + region)
  debug('type: ' + type)


  if(level === 0){

    debug('root requesttttt')

    pool.any(queries.getRasterNiche.getRasterAvailableVariables, {
      region: region
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
  else if(level === 1){

    debug('variable selected request')

    pool.any(queries.getRasterNiche.getRasterVariableSelected, {
      type: type,
      region: region
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
  else{

    debug('range selected request')

    pool.any(queries.getRasterNiche.getRasterVariableById, {
      layername: field,
      typename: type,
      region: region
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

  debug('getAvailableVariables')

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
* getCountGridid regresa el conteo por celda de un conjunto de especies
* definidas por el cliente
*
* Servidor Niche: getCountGridid
*
* @param {express.Request} req
* @param {express.Response} res
*
*/
exports.getCountGridid = function (req, res, next) {
  debug('getCountGridid')

  var columnas = ['gridid', 'conteo']
  var species = getParam(req, 'species', [])
  var isNicho = getParam(req, 'nicho', false)
  var footprint_region = getParam(req, 'footprint_region', default_region)

  var grid_res = getParam(req, 'grid_res', default_resolution)

  var res_celda = 'cells_' + grid_res + 'km'
  var res_grid = 'gridid_' + grid_res + 'km'

  //debug(columnas)
  //debug(spids)

  if (isNicho === true) {
    columnas.push('spids')
    columnas.push('bioclim')
  }

  pool.any(queries.getCountGridid.getCount, {
    species: species,
    res_celda: res_celda,
    res_grid: res_grid,
    columns: columnas,
    footprint_region: footprint_region,
    grid_res:grid_res
  }).then(function (data) {
    res.json({'data': data})
  }).catch(function (error) {
    debug(error)
    next(error)
  })
}


exports.getGroupCountGrididByCell = function (req, res) {


  debug('getGroupCountGrididByCell')

  // catching parameters
  var footprint_region = getParam(req, 'region', default_region)
  var grid_res = getParam(req, 'grid_res', default_resolution)
  var nodes = getParam(req, 'nodes', [])
  // var cellselected = getParam(req, 'cellselected', false)
  var lat = getParam(req, 'lat', 0)
  var long = getParam(req, 'long', 0)

  // debug("cellselected: " + cellselected)
  debug("lat: " + lat)
  debug("long: " + long)
  

  // defining necessary varaiables 
  var region_cells = 'cells_' + grid_res + 'km_' + footprint_region
  var res_views = 'grid_geojson_' + grid_res + 'km_aoi'
  var res_cells = 'cells_' + grid_res + 'km'
  var where_clause = ''
  var nodes_bio = ""
  var nodes_abio = ""
  var first_bio = true
  var first_abio = true


  // getting all cells
  nodes.forEach((group, index) => {

    merge_vars = group['merge_vars']
    // debug(group)

    where_clause = verb_utils.getWhereClauseFromGroupTaxonArray(merge_vars, false)
    where_clause = where_clause.replace("WHERE","")
    // debug(where_clause)

    if (group['biotic'] === 'true' || group['biotic'] === true) { 
      
      if (first_bio){
        nodes_bio += where_clause
        first_bio = false
      }
      else{
        nodes_bio += " or " + where_clause
      }
        

    } else {

      if (first_abio){
        nodes_abio += where_clause
        first_abio = false
      }
      else{
        nodes_abio += " or " + where_clause
      }

    }

  })

  // debug(nodes_bio)
  // debug(nodes_abio)

  var bio_select = ""
  var abio_select = ""
  var isunion_sp = false

  if(nodes_bio != "" && nodes_abio != "")
    isunion_sp = true

  debug("isunion_sp: " + isunion_sp)

  if(nodes_bio != ""){
    bio_select = queries.taxonsGroupNodes.getCellsBioSP
    bio_select = bio_select.toString().replace(/{res:raw}/g, grid_res)
    bio_select = bio_select.toString().replace(/{region:raw}/g, footprint_region)
    bio_select = bio_select.toString().replace(/{nodes_bio:raw}/g, nodes_bio)
  }

  if(nodes_abio != ""){
    abio_select = isunion_sp ? " UNION " : ""
    abio_select += queries.taxonsGroupNodes.getCellsAbioSP
    abio_select = abio_select.toString().replace(/{res:raw}/g, grid_res)
    abio_select = abio_select.toString().replace(/{region:raw}/g, footprint_region)
    abio_select = abio_select.toString().replace(/{nodes_abio:raw}/g, nodes_abio)
  }

  debug(bio_select)
  debug(abio_select)

  pool.any(queries.getCells.getSpCountsByCellId, {
       bio_select: bio_select,
       abio_select: abio_select,
       region: footprint_region,
       res: grid_res,
       latitud: lat,
       longitud: long
  }).then(function (data) {

    res.json({"ok":true, "data": data})

  }).catch(function (error) {
      
    res.json({"ok":true, "message": 'an error has ocurrred!', "error": error})

  })



}




exports.getGroupCountGridid = function (req, res) {
  
  debug('getGroupCountGridid')

  // catching parameters
  var footprint_region = getParam(req, 'region', default_region)
  var grid_res = getParam(req, 'grid_res', default_resolution)
  var nodes = getParam(req, 'nodes', [])

  // defining necessary varaiables 
  var region_cells = 'cells_' + grid_res + 'km_' + footprint_region
  var res_views = 'grid_geojson_' + grid_res + 'km_aoi'
  var res_cells = 'cells_' + grid_res + 'km'
  var where_clause = ''
  var query = "" 
  var q =''
  var select = ''
  
  // getting all cells
  nodes.forEach((group, index) => {

    merge_vars = group['merge_vars']
    // debug(group)
    where_clause = verb_utils.getWhereClauseFromGroupTaxonArray(merge_vars, false)

    if (group['biotic'] === 'true' || group['biotic'] === true) { 
      q += (index > 0 ? ", " : "WITH ") + queries.taxonsGroupNodes.getCellsBio
      q = q.toString().replace(/{region_cells:raw}/g, region_cells)
      q = q.toString().replace(/{where_filter:raw}/g, where_clause)


    } else {

      q += (index > 0 ? ", " : "WITH ") + queries.taxonsGroupNodes.getCellsAbio
      q = q.toString().replace(/{where_filter:raw}/g, where_clause)
      q = q.toString().replace(/{res_cells:raw}/g, res_cells)
      q = q.toString().replace(/{res_views:raw}/g, res_views)
      q = q.toString().replace(/{region:raw}/g, footprint_region)

    }
    
    select += (index > 0 ? "\n UNION \n" : "") + queries.taxonsGroupNodes.selectCount
    q = q.toString().replace(/{index:raw}/g, index)
    select = select.toString().replace(/{index:raw}/g, index)


  })

  query = queries.taxonsGroupNodes.getGroupCount

  //const query1 = pgp.as.format(query, {aux: q, summary: select})
  // debug(q)
  // debug(select)
  // debug(query)


  pool.any(query, {
       aux: q,
       summary: select
  }).then(function (data) {

    res.json({"ok":true, "data": data})

  }).catch(function (error) {
      
    res.json({"ok":true, "message": 'an error has ocurrred!', "error": error})

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
  debug('getGrididsNiche')
  var res_celda = getParam(req, 'res_celda', default_resolution)

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
      var startTime = process.hrtime();

      var spid              = parseInt(getParam(req, 'id'))
      var sfecha            = getParam(req, 'sfecha', false)
      var sfosil            = getParam(req, 'sfosil', false)
      var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
      var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var res_celda = getParam(req, 'res_celda', "gridid_16km")
      var footprint_region    = parseInt(getParam(req, 'footprint_region',default_region))

      var grid_resolution = getParam(req, 'grid_res',16)
      var res_celda_sp =  "cells_"+grid_resolution+"km"   
      var res_celda_snib =  "gridid_"+grid_resolution+"km" 
      var res_celda_snib_tb = "grid_geojson_"+grid_resolution+"km_aoi" 

      // debug(spid)
      // debug(sfecha)
      // debug(sfosil)
      // debug(grid_resolution)
      // debug(fecha_incio)
      // debug(fecha_fin)
      // debug(footprint_region)
      
      debug('Antes de obtener N en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

      pool.task(t => {

          return t.one(queries.basicAnalysis.getN, {

              grid_resolution: grid_resolution,
              footprint_region: footprint_region

          }).then(resp => {

              debug("id_country:" + resp.id_country)
              var region = resp.id_country

              if( (parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ) && sfecha === 'false'){
                debug('CASO: rango y sin fecha')
                debug("res_celda: " + res_celda)
                debug("res_celda_sp: " + res_celda_sp)
                debug("res_celda_snib: " + res_celda_snib)
                debug("res_celda_snib_tb: " + res_celda_snib_tb)
                debug("lb_fosil: " + lb_fosil)
                debug("footprint_region: " + footprint_region)

                debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

                return pool.any(queries.getSpeciesNiche.getSpeciesSDR, {
                  spid: spid,
                  lim_inf: fecha_incio.format('YYYY'),
                  lim_sup: fecha_fin.format('YYYY'),
                  res_celda: res_celda,
                  res_celda_sp: res_celda_sp,
                  res_celda_snib: res_celda_snib,
                  res_celda_snib_tb: res_celda_snib_tb,
                  sfosil: lb_fosil,
                  region: footprint_region
                })
                      
              }
              else if( parseInt(fecha_incio.format('YYYY')) == 1500 && parseInt(fecha_fin.format('YYYY')) == parseInt(moment().format('YYYY'))  && sfecha === 'false'){
                debug('CASO: solo sin fecha')
                debug("res_celda: " + res_celda)
                debug("res_celda_sp: " + res_celda_sp)
                debug("res_celda_snib: " + res_celda_snib)
                debug("res_celda_snib_tb: " + res_celda_snib_tb)
                debug("lb_fosil: " + lb_fosil)
                debug("footprint_region: " + footprint_region)

                debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

                return pool.any(queries.getSpeciesNiche.getSpeciesSD, {
                  spid: spid,
                  res_celda: res_celda,
                  res_celda_sp: res_celda_sp,
                  res_celda_snib: res_celda_snib,
                  res_celda_snib_tb: res_celda_snib_tb,
                  sfosil: lb_fosil,
                  region: footprint_region
                })
                      
              }
              else if( parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ){
                debug('CASO: solo rango')
                debug("res_celda: " + res_celda)
                debug("res_celda_sp: " + res_celda_sp)
                debug("res_celda_snib: " + res_celda_snib)
                debug("res_celda_snib_tb: " + res_celda_snib_tb)
                debug("lb_fosil: " + lb_fosil)
                debug("footprint_region: " + footprint_region)

                debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

                return pool.any(queries.getSpeciesNiche.getSpeciesR, {
                  spid: spid,
                  lim_inf: fecha_incio.format('YYYY'),
                  lim_sup: fecha_fin.format('YYYY'),
                  res_celda: res_celda,
                  res_celda_sp: res_celda_sp,
                  res_celda_snib: res_celda_snib,
                  res_celda_snib_tb: res_celda_snib_tb,
                  sfosil: lb_fosil,
                  region: footprint_region
                })
                      
              }
              else{
                debug('CASO: sin filtros')
                debug("res_celda: " + res_celda)
                debug("res_celda_sp: " + res_celda_sp)
                debug("res_celda_snib: " + res_celda_snib)
                debug("res_celda_snib_tb: " + res_celda_snib_tb)
                debug("lb_fosil: " + lb_fosil)
                debug("footprint_region: " + footprint_region)

                debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');
                
                return pool.any(queries.getSpeciesNiche.getSpecies, {
                  spid: spid,
                  res_celda: res_celda,
                  res_celda_sp: res_celda_sp,
                  res_celda_snib: res_celda_snib,
                  res_celda_snib_tb: res_celda_snib_tb,
                  sfosil: lb_fosil,
                  region: footprint_region
                })
                      
              }

          })

      })
      .then(data => {

          debug('Query ejecutada, (antes de enviar respuesta) en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

          res.json({'data': data})

      })
      .catch(error => {
          debug(error)

          return res.json({
            ok: false,
            error: error
          });
      });

}




/**
 *
 * Servidor Niche: getSpeciesArrayNiche
 *
 * Obtiene las variables bioticas que coinciden a una cadena dada
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getSpeciesArrayNiche = function (req, res, next) {

      debug("getSpeciesArrayNiche")
      var startTime = process.hrtime();

      var spids             = getParam(req, 'spids')
      var sfecha            = getParam(req, 'sfecha', false)
      var sfosil            = getParam(req, 'sfosil', false)
      var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
      var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var res_celda = getParam(req, 'res_celda', "gridid_16km")
      var footprint_region    = parseInt(getParam(req, 'footprint_region',default_region))

      var grid_resolution = getParam(req, 'grid_res',16)
      var res_celda_sp =  "cells_"+grid_resolution+"km"   
      var res_celda_snib =  "gridid_"+grid_resolution+"km" 
      var res_celda_snib_tb = "grid_geojson_"+grid_resolution+"km_aoi" 

      debug(spids)
      // debug(spids.toString())

      // debug(sfecha)
      // debug(sfosil)
      // debug(grid_resolution)
      // debug(fecha_incio)
      // debug(fecha_fin)
      // debug(footprint_region)
      
      debug('Antes de obtener N en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

      pool.task(t => {

      //     return t.one(queries.basicAnalysis.getN, {

      //         grid_resolution: grid_resolution,
      //         footprint_region: footprint_region

      //     }).then(resp => {

              // debug("id_country:" + resp.id_country)
              // var region = resp.id_country

              if( (parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ) && sfecha === 'false'){
                debug('CASO: rango y sin fecha')
                // debug("res_celda: " + res_celda)
                // debug("res_celda_sp: " + res_celda_sp)
                // debug("res_celda_snib: " + res_celda_snib)
                // debug("res_celda_snib_tb: " + res_celda_snib_tb)
                // debug("lb_fosil: " + lb_fosil)
                // debug("footprint_region: " + footprint_region)

                debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

                return t.any(queries.getSpeciesNiche.getSpeciesArraySDR, {
                  spids: spids.toString(),
                  lim_inf: fecha_incio.format('YYYY'),
                  lim_sup: fecha_fin.format('YYYY'),
                  res_celda: res_celda,
                  res_celda_sp: res_celda_sp,
                  res_celda_snib: res_celda_snib,
                  res_celda_snib_tb: res_celda_snib_tb,
                  sfosil: lb_fosil,
                  region: footprint_region
                })
                      
              }
              else if( parseInt(fecha_incio.format('YYYY')) == 1500 && parseInt(fecha_fin.format('YYYY')) == parseInt(moment().format('YYYY'))  && sfecha === 'false'){
                debug('CASO: solo sin fecha')
                // debug("res_celda: " + res_celda)
                // debug("res_celda_sp: " + res_celda_sp)
                // debug("res_celda_snib: " + res_celda_snib)
                // debug("res_celda_snib_tb: " + res_celda_snib_tb)
                // debug("lb_fosil: " + lb_fosil)
                // debug("footprint_region: " + footprint_region)

                debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

                
                //return t.any(queries.getSpeciesNiche.getSpeciesSD, {
                return t.any(queries.getSpeciesNiche.getSpeciesArraySD, {
                  spids: spids.toString(),
                  res_celda: res_celda,
                  res_celda_sp: res_celda_sp,
                  res_celda_snib: res_celda_snib,
                  res_celda_snib_tb: res_celda_snib_tb,
                  sfosil: lb_fosil,
                  region: footprint_region
                })
                      
              }
              else if( parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ){
                debug('CASO: solo rango')
                // debug("res_celda: " + res_celda)
                // debug("res_celda_sp: " + res_celda_sp)
                // debug("res_celda_snib: " + res_celda_snib)
                // debug("res_celda_snib_tb: " + res_celda_snib_tb)
                // debug("lb_fosil: " + lb_fosil)
                // debug("footprint_region: " + footprint_region)

                debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

                return t.any(queries.getSpeciesNiche.getSpeciesArrayR, {
                  spids: spids.toString(),
                  lim_inf: fecha_incio.format('YYYY'),
                  lim_sup: fecha_fin.format('YYYY'),
                  res_celda: res_celda,
                  res_celda_sp: res_celda_sp,
                  res_celda_snib: res_celda_snib,
                  res_celda_snib_tb: res_celda_snib_tb,
                  sfosil: lb_fosil,
                  region: footprint_region
                })
                      
              }
              else{
                debug('CASO: sin filtros')
                // debug("res_celda: " + res_celda)
                // debug("res_celda_sp: " + res_celda_sp)
                // debug("res_celda_snib: " + res_celda_snib)
                // debug("res_celda_snib_tb: " + res_celda_snib_tb)
                // debug("lb_fosil: " + lb_fosil)
                // debug("footprint_region: " + footprint_region)

                debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');
                
                return t.any(queries.getSpeciesNiche.getSpeciesArray, {
                  spids: spids.toString(),
                  res_celda: res_celda,
                  res_celda_sp: res_celda_sp,
                  res_celda_snib: res_celda_snib,
                  res_celda_snib_tb: res_celda_snib_tb,
                  sfosil: lb_fosil,
                  region: footprint_region
                })
                      
              }

          // })

      })
      .then(data => {

          debug('Query ejecutada, (antes de enviar respuesta) en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

          // debug(data)

          res.json({'data': data})

      })
      .catch(error => {
          debug(error)

          return res.json({
            ok: false,
            error: error
          });
      });

}


/**
 *
 * Servidor Niche: getSpeciesTaxonNiche
 *
 * Obtiene las ocurrencias bioticas que coinciden con taxones recibidos
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getSpeciesTaxonNiche = function (req, res, next) {

      debug("getSpeciesTaxonNiche")
      var startTime = process.hrtime();

      var taxones           = getParam(req, 'taxones', [])
      var sfecha            = getParam(req, 'sfecha', false)
      var sfosil            = getParam(req, 'sfosil', false)
      var lb_fosil = sfosil === "false" || sfosil === false ? " and (ejemplarfosil <> 'SI' or ejemplarfosil is null) " : "";
      var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')
      var res_celda = getParam(req, 'res_celda', "gridid_16km")
      var footprint_region    = parseInt(getParam(req, 'footprint_region',default_region))

      var grid_resolution = getParam(req, 'grid_res',16)
      var res_celda_sp =  "cells_"+grid_resolution+"km"   
      var res_celda_snib =  "gridid_"+grid_resolution+"km" 
      var res_celda_snib_tb = "grid_geojson_"+grid_resolution+"km_aoi" 

      //debug(taxones)
      //var str_taxones = verb_utils.procesaTaxones(taxones);


      var array_taxon = []
      var aux
      taxones.forEach((taxon, index) => {
        aux = {}
        aux['taxon_rank'] = taxon['taxon']
        aux['value'] = taxon['value']

        array_taxon.push(aux)
      })

      var str_taxones = verb_utils.getWhereClauseFromGroupTaxonArray(array_taxon, true)
      // debug(str_taxones)
      // debug(str_taxones)

      // debug(spids.toString())

      // debug(sfecha)
      // debug(sfosil)
      // debug(grid_resolution)
      // debug(fecha_incio)
      // debug(fecha_fin)
      // debug(footprint_region)
      /*const query1 = pgp.as.format(queries.getSpeciesNiche.getSpeciesTaxonArray, {
              taxones: str_taxones,
              res_celda: res_celda,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              res_celda_snib_tb: res_celda_snib_tb,
              sfosil: lb_fosil,
              region: footprint_region
            })
      debug(query1)*/
      
      debug('Antes de obtener N en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

      pool.task(t => {

          if( (parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ) && sfecha === 'false'){
            debug('CASO: rango y sin fecha')
            // debug("res_celda: " + res_celda)
            // debug("res_celda_sp: " + res_celda_sp)
            // debug("res_celda_snib: " + res_celda_snib)
            // debug("res_celda_snib_tb: " + res_celda_snib_tb)
            // debug("lb_fosil: " + lb_fosil)
            // debug("footprint_region: " + footprint_region)

            debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

            return t.any(queries.getSpeciesNiche.getSpeciesTaxonArraySDR, {
              taxones: str_taxones,
              lim_inf: fecha_incio.format('YYYY'),
              lim_sup: fecha_fin.format('YYYY'),
              res_celda: res_celda,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              res_celda_snib_tb: res_celda_snib_tb,
              sfosil: lb_fosil,
              region: footprint_region
            })
                  
          }
          else if( parseInt(fecha_incio.format('YYYY')) == 1500 && parseInt(fecha_fin.format('YYYY')) == parseInt(moment().format('YYYY'))  && sfecha === 'false'){
            debug('CASO: solo sin fecha')
            // debug("res_celda: " + res_celda)
            // debug("res_celda_sp: " + res_celda_sp)
            // debug("res_celda_snib: " + res_celda_snib)
            // debug("res_celda_snib_tb: " + res_celda_snib_tb)
            // debug("lb_fosil: " + lb_fosil)
            // debug("footprint_region: " + footprint_region)

            debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

            
            //return t.any(queries.getSpeciesNiche.getSpeciesSD, {
            return t.any(queries.getSpeciesNiche.getSpeciesTaxonArraySD, {
              taxones: str_taxones,
              res_celda: res_celda,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              res_celda_snib_tb: res_celda_snib_tb,
              sfosil: lb_fosil,
              region: footprint_region
            })
                  
          }
          else if( parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ){
            debug('CASO: solo rango')
            // debug("res_celda: " + res_celda)
            // debug("res_celda_sp: " + res_celda_sp)
            // debug("res_celda_snib: " + res_celda_snib)
            // debug("res_celda_snib_tb: " + res_celda_snib_tb)
            // debug("lb_fosil: " + lb_fosil)
            // debug("footprint_region: " + footprint_region)

            debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

            return t.any(queries.getSpeciesNiche.getSpeciesTaxonArrayR, {
              taxones: str_taxones,
              lim_inf: fecha_incio.format('YYYY'),
              lim_sup: fecha_fin.format('YYYY'),
              res_celda: res_celda,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              res_celda_snib_tb: res_celda_snib_tb,
              sfosil: lb_fosil,
              region: footprint_region
            })
                  
          }
          else{
            debug('CASO: sin filtros')
            // debug("res_celda: " + res_celda)
            // debug("res_celda_sp: " + res_celda_sp)
            // debug("res_celda_snib: " + res_celda_snib)
            // debug("res_celda_snib_tb: " + res_celda_snib_tb)
            // debug("lb_fosil: " + lb_fosil)
            // debug("footprint_region: " + footprint_region)

            debug('Antes de ejecutar query en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');
            
            return t.any(queries.getSpeciesNiche.getSpeciesTaxonArray, {
              taxones: str_taxones,
              res_celda: res_celda,
              res_celda_sp: res_celda_sp,
              res_celda_snib: res_celda_snib,
              res_celda_snib_tb: res_celda_snib_tb,
              sfosil: lb_fosil,
              region: footprint_region
            })
                  
          }

          

      })
      .then(data => {

          debug('Query ejecutada, (antes de enviar respuesta) en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

          // debug(data)

          res.json({'data': data})

      })
      .catch(error => {
          debug(error)

          return res.json({
            ok: false,
            error: error
          })
      })

}






/**
 *
 * Servidor Niche: getEntListByTaxonNiche
 *
 * Obtiene las variables bioticas que coinciden a una cadena dada en la estrutura genero, epiteto y nombreinfra
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getEntListByTaxonNiche = function (req, res, next) {

    debug("getEntListByTaxonNiche")
    var startTime = process.hrtime();

    var col_epiteto = "especieepiteto"
    var col_infra = "nombreinfra"
    
    var str       = getParam(req, 'searchStr')
    var has_limit = parseInt(getParam(req, 'limit', false))
    has_limit = false // se elimina limite en autocomplete
    var source    = parseInt(getParam(req, 'source'))
    var region    = parseInt(getParam(req, 'footprint_region',default_region))
    var nivel     = getParam(req, 'nivel', min_taxon_name)
    var columnas  = verb_utils.getColumns(source, nivel, "getEntListByTaxonNiche")

    var grid_resolution = getParam(req, 'grid_res',16)
    var res_celda_sp =  'cells_'+grid_resolution+'km_'+region
    var res_celda_snib =  'gridid_'+grid_resolution+'km'
    var res_celda_snib_tb = 'grid_'+grid_resolution+'km_aoi'
    
    res_celda_sp = (source == 1) ? res_celda_sp : 'array[]::int[]'
    var val_tree = (source == 1) ? ' and icount('+res_celda_sp+') > 0 ' : ''

    var txt_limite = has_limit === false ? '' : 'limit ' + limite

    debug("nivel: " + nivel)
    debug("str: " + str)
    debug("limite: " + limite)
    debug("columnas: " + columnas)
    // debug("res_celda_sp: " + res_celda_sp)
    debug("val_tree: " + val_tree)
    

    var streTerms = str.trim().split(" ");
    debug(streTerms)
    debug(streTerms.length)

    var genero = streTerms[0]
    var epiteto = streTerms.length > 1 ? "and lower("+col_epiteto+") like lower('"+streTerms[1]+"%')"  : ""
    var infra = streTerms.length > 2 ? "and lower("+nombreinfra+") like lower('"+streTerms[2]+"%')"  : ""

    debug("epiteto:" + epiteto)
    debug("infra:" + infra)


    debug('Parsea datos, (antes de ejecutar query) en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

    pool.any(queries.getEntListNiche.getEntListByTaxon, {
      genero: genero,
      epiteto: epiteto,
      infra: infra,
      columnas: columnas,
      nivel: nivel,
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb,
      val_tree: val_tree,
      limite: txt_limite,
      region: region
    })
    .then(function (data) {

      debug('Query ejecutada, (antes de enviar respuesta) en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');
      
      // debug("Respuesta query")
      // debug(data)

      res.json({'data': data})
    })
    .catch(function (error) {
      debug(error)
      next(error)
    })

}



exports.getStateMunListNiche = function (req, res, next) {

    debug("getStateMunListNiche")

    var str       = getParam(req, 'searchStr')
    var has_limit = getParam(req, 'limit', false)
    var region    = parseInt(getParam(req, 'footprint_region',default_region))
    var grid_res    = getParam(req, 'grid_res',default_resolution)

    var res_celda_snib    =  'gridid_'+grid_res+'km'
    var res_celda_snib_tb = 'grid_'+grid_res+'km_aoi'
    var txt_limite = has_limit === false ? '' : 'limit ' + limite

    debug("str: " + str)
    debug("has_limit: " + has_limit)
    debug("region: " + region)
    debug("grid_res: " + grid_res)
    debug("txt_limite: " + txt_limite)

    var col_name = ""
    var selected_columns = ""

    if(grid_res == "mun"){
      col_name = "NOM_MUN"
      selected_columns = '"NOM_ENT" as entidad, "NOM_MUN" as municipio'
    }
    else if(grid_res == "state" || grid_res == "ageb"){

      col_name = "NOM_ENT"
      selected_columns = '"NOM_ENT" as entidad'
    }
    else{
      col_name = "NOM_ENT"
      selected_columns = '"NOM_ENT" as entidad'
    }

    // debug(queries.getEntListNiche.getStateMunList)
       
    pool.any(queries.getEntListNiche.getStateMunList, {
      str: str,
      col_name: col_name,
      selected_columns:selected_columns,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb,
      region: region,
      limite: txt_limite
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
    var startTime = process.hrtime();
    
    var str       = getParam(req, 'searchStr')
    var has_limit = parseInt(getParam(req, 'limit', false))
    var source    = parseInt(getParam(req, 'source'))
    var region    = parseInt(getParam(req, 'footprint_region',default_region))
    var nivel     = getParam(req, 'nivel', min_taxon_name)
    
    var grid_resolution   = getParam(req, 'grid_res',16)
    var res_celda_sp      =  'cells_'+grid_resolution+'km_'+region
    var res_celda_snib    =  'gridid_'+grid_resolution+'km'
    var res_celda_snib_tb = 'grid_'+grid_resolution+'km_aoi'
    
    // res_celda_sp = (source == 1) ? res_celda_sp : 'array[]::int[]'
    // var val_tree = (source == 1) ? ' and icount('+res_celda_sp+') > 0 ' : ''
    var val_tree = ' and icount('+res_celda_sp+') > 0 '
    var region_col = ' and region_' + region

    var txt_limite = has_limit === false ? '' : 'limit ' + limite

    
    var terms, gen_lb, sp_lb
    var ad_param = ""

    var columnas  = verb_utils.getColumns(source, nivel)

    // validación para tratar campo especieepiteto
    if(nivel === "especieepiteto"){

      nivel = "generovalido"
      terms = str.split(" ")
      if(terms.length>1){
        gen_lb = terms[0]
        sp_lb = terms[1]
        ad_param = " and especieepiteto like lower('" + sp_lb + "%') "
        str = gen_lb
      }

    }
    

    debug("nivel: " + nivel)
    debug("str: " + str)
    debug("ad_param: " + ad_param)
    // debug("limite: " + limite)
    debug("columnas: " + columnas)
    // debug("res_celda_sp: " + res_celda_sp)
    debug("val_tree: " + val_tree)
    // debug(pool)


    debug('Parsea datos, (antes de ejecutar query) en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');

    debug("---------------------------------------");
    debug('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    const query1 = pgp.as.format(queries.getEntListNiche.getEntList, {
                                    str: str,
                                    columnas: columnas,
                                    nivel: nivel,
                                    res_celda_sp: res_celda_sp,
                                    res_celda_snib: res_celda_snib,
                                    res_celda_snib_tb: res_celda_snib_tb,
                                    val_tree: val_tree,
                                    limite: txt_limite,
                                    region: region,
                                    ad_param: ad_param,
                                    region_col: region_col
                                  });
    debug('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    debug(query1);
    debug("---------------------------------------");

    pool.any(queries.getEntListNiche.getEntList, {
      str: str,
      columnas: columnas,
      nivel: nivel,
      res_celda_sp: res_celda_sp,
      res_celda_snib: res_celda_snib,
      res_celda_snib_tb: res_celda_snib_tb,
      val_tree: val_tree,
      limite: txt_limite,
      region: region,
      ad_param: ad_param,
      region_col: region_col
    })
    .then(function (data) {

      debug('Query ejecutada, (antes de enviar respuesta) en: ' + verb_utils.parseHrtimeToSeconds(process.hrtime(startTime)) + 'segundos');
      
      // debug("Respuesta query")
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

  debug('getSubAOI')

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
            message: 'Error al procesar la query'
          })
          next(error)
        })
}


/**
* getN
*
* Obtiene la N para analisis dependiendo la region
* 
* @param {express.Request} req
* @param {express.Response} res
*
*/
exports.getN = function(req, res) {

      debug("getN");

      var grid_resolution = verb_utils.getParam(req, 'grid_res',16)
      var res_celda_snib_tb = "grid_geojson_"+grid_resolution+"km_aoi" 
      
      debug("default_region: " + default_region);
      var footprint_region = parseInt(verb_utils.getParam(req, 'footprint_region', default_region))
      // var country = verb_utils.getRegionCountry(footprint_region)

      // debug("res_celda_snib_tb: " + res_celda_snib_tb)
      debug("footprint_region: " + footprint_region)

      pool.any(queries.basicAnalysis.getN,{
        grid_resolution: grid_resolution,
        footprint_region: footprint_region
      })
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
        })

}



/**
* getAvailableCountries
*
* Obtiene la el id del pais que estan disponibles en el sistema
* 
* @param {express.Request} req
* @param {express.Response} res
*
*/
exports.getAvailableCountries = function(req, res) {

      debug("getAvailableCountries");

      pool.any(queries.subaoi.getAvailableCountries,{
      })
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
        })

}


/**
* getAvailableCountriesFootprint
*
* Obtiene la el footprint_region del pais que estan disponibles en el sistema
* 
* @param {express.Request} req
* @param {express.Response} res
*
*/
exports.getAvailableCountriesFootprint = function(req, res) {

      debug("getSubAOI");

      pool.any(queries.subaoi.getSubAOI,{
      })
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
        })

}


exports.getIdFromName = function(req, res) {

    debug("getIdFromName");

    var spaceies_array = verb_utils.getParam(req, 'species', [])
    var species_list = verb_utils.arrayToString(spaceies_array)
    debug("species: " + species_list)

    pool.any(queries.apiUtils.getIdFromName,{
      species_list: species_list
    })
    .then(function (data) {
      res.json({
        'species': data,
        ok: true
      })
    })
    .catch(function (error) {
      return res.json({
        err: error,
        ok: false,
        message: "Error al procesar la query"
      })
    })

}


exports.getGridGivenPoints = function (req, res, next) {

  debug("getGridGivenPoints")
  
  var target_points     = getParam(req, 'target_points', [])
  var date            = getParam(req, 'date', false)
  var fosil            = getParam(req, 'fosil', false)
  var lim_inf            = getParam(req, 'lim_inf', 1500)
  var lim_sup            = getParam(req, 'lim_sup', 2019)
  var grid_resolution          = getParam(req, 'grid_resolution', 16)
  var region            = getParam(req, 'region', 1)

  var points = '['
  var number_occ = 0

  target_points.forEach(function(occ) {
    
    if(fosil){

      if(date){

        if((occ['anio'] >= lim_inf && occ['anio'] <= lim_sup) || occ['anio'] == 9999){
          
          if(number_occ > 0) {
            points += ', '
          }  

          points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
          number_occ += 1

        }
        

      } else { 

          if(occ['anio'] >= lim_inf && occ['anio'] <= lim_sup){

            if(number_occ > 0) {
              points += ', '
            } 

            points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
            number_occ += 1
          
          }

    }

  } else {

      if(!occ['fosil']){

        if(date){

          if((occ['anio'] >= lim_inf && occ['anio'] <= lim_sup) || occ['anio'] !== 9999){
          
            if(number_occ > 0) {
              points += ', '
            }  

            points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
            number_occ += 1

          }

        } else {

            if(occ['anio'] >= lim_inf && occ['anio'] <= lim_sup){

              if(number_occ > 0) {
                points += ', '
              }  

              points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
              number_occ += 1
            
            }

       }

      }  

  }

  });

  points += ']'

  pool.task(t => {

    var query = queries.countsTaxonGroups.getCellSincePoint
    const query1 = pgp.as.format(query, {

      res: grid_resolution,
      points: points

    })
    debug(query1)

    return t.any(query, {

      res: grid_resolution,
      points: points

    }).then(resp => {

      var _data = {}
      resp.forEach(cell => {
        if(_data[cell['gridid']] != null ) {

          _data[cell['gridid']] += 1

        } else {

          _data[cell['gridid']] = 1          

        }
      })

      var data = []
      Object.keys(_data).forEach(cell => {
        data.push({gridid: cell, occ: _data[cell]})
      })
      
      res.json({
            ok: true,
            data: data
        })

    });

  }).catch(error => {

      debug("ERROR EN PROMESA" + error)

      res.json({
          ok: false,
          message: "Error al ejecutar la petición",
          data:[],
          error: error
        })

    });
  
}


exports.getGridSpeciesTaxonNiche = function (req, res, next) {

  debug("getGridSpeciesTaxonNiche")

  var date = new Date()
  var day = date.getDate()
  var month = date.getMonth() + 1
  var year = date.getFullYear()
  
  var target_taxons     = getParam(req, 'target_taxons')
  var sfecha            = false // getParam(req, 'sfecha', false)
  // var sfosil            = getParam(req, 'sfosil', false)
  var liminf            = getParam(req, 'liminf', verb_utils.formatDate(new Date("1500-01-01")) )
  var limsup            = getParam(req, 'limsup',  year+"-"+month+"-"+day)
  var grid_res          = getParam(req, 'grid_res', default_resolution)
  var region            = getParam(req, 'region', 1)
  var traffic_light     = getParam(req, 'traffic_light', 'none')
  
  var casos_periodo = 0
  var target_cells = 0
  var cells_excluded = 0
  debug("liminf: " + liminf)
  debug("limsup: " + limsup)
  debug("sfecha: " + sfecha)
  // debug("sfosil: " + sfosil)

  var species_filter  = verb_utils.getWhereClauseFromGroupTaxonArray(target_taxons, true)
  var resolution_view = 'grid_geojson_' + grid_res + 'km_aoi'
  var gridid          = 'gridid_' + grid_res + 'km'
  var snib_grid_xxkm  = 'snib_grid_' + grid_res + 'km'
  var where_filter    = ''
  var where_filter_first = ''


  where_filter = " and (make_date(aniocolecta, mescolecta, diacolecta) between "
                + "'" + liminf + "' and '" + limsup + "'"
                + " and diacolecta <> 99 and diacolecta <> -1"
                + " and mescolecta <> 99 and mescolecta <> -1"
                + " and aniocolecta <> 9999 and aniocolecta <> -1)"

  where_filter_first = "(make_date(aniocolecta, mescolecta, diacolecta) < "
                + "'" + liminf + "'" 
                + " and diacolecta <> 99 and diacolecta <> -1"
                + " and mescolecta <> 99 and mescolecta <> -1"
                + " and aniocolecta <> 9999 and aniocolecta <> -1) "

  debug(where_filter_first)

  if(sfecha === true){
    where_filter += " or (true and a.gridid_statekm is not null)"
  }

  // debug("species_filter: " + species_filter)
  // debug("resolution_view: " + resolution_view)
  // debug("region: " + region)
  // debug("gridid: " + gridid)
  // debug("snib_grid_xxkm: " + snib_grid_xxkm)
  // debug("where_filter: " + where_filter)
  // debug("liminf: " + liminf)
  // debug("limsup: " + limsup)

  var query = queries.getGridSpeciesNiche.getGridSpeciesTaxons

  if(traffic_light == 'red' || traffic_light == 'green'){

    query = queries.getGridSpeciesNiche.getGridSpeciesTaxonsTrafficLight

  } 

  const query1 = pgp.as.format(query, {'species_filter' : species_filter, 
            'resolution_view': resolution_view,
            'region'         : region,
            'gridid'         : gridid,
            'snib_grid_xxkm' : snib_grid_xxkm,
            'where_filter'   : where_filter,
            'where_filter_first': where_filter_first
          })
  

  debug(query1)

  pool.any(query, {
            'species_filter' : species_filter, 
            'resolution_view': resolution_view,
            'region'         : region,
            'gridid'         : gridid,
            'snib_grid_xxkm' : snib_grid_xxkm,
            'where_filter'   : where_filter,
            'where_filter_first': where_filter_first
          }
      ).then(function (data) {

        debug(data.length + ' ocurrence cells')
        var processed_data = {}

        data.forEach(item =>{
          if(processed_data[item['gridid']] == null){

            processed_data[item['gridid']] = {'gridid':item['gridid'], 'fp': 0, 'tp': 0, 'occ': 0, 'target': false}
            
          }

          if(item['p'] == 'f' && item['occ'] > 0){

             processed_data[item['gridid']]['fp'] = 1

          } else if(item['p'] == 't' && item['occ'] > 0){

            processed_data[item['gridid']]['tp'] = 1
            processed_data[item['gridid']]['occ'] = item['occ']
            casos_periodo += parseInt(item['occ'])

          } else {
            
            processed_data[item['gridid']]['target'] = true
            processed_data[item['gridid']]['occ'] = item['occ']
            casos_periodo += parseInt(item['occ'])
            target_cells += 1

          }

        })


        processed_data = Object.values(processed_data)

        processed_data.forEach(item => {

          if(traffic_light == 'red'){

            if(item['fp'] == 0 && item['tp'] == 1){
              item['target'] = true
              target_cells += 1
            } else {
              cells_excluded += 1
            }


          } else if(traffic_light == 'green'){

            if(item['fp'] == 1 && item['tp'] == 0) {
              item['target'] = true
              target_cells += 1
            } else {
              cells_excluded += 1
            }           

          } else if(!item['target']){
            cells_excluded += 1
          }

        })

        res.json({
          ok: true,
          'data': processed_data,
          'training_cases': casos_periodo,
          'target_cells': target_cells,
          'excluded_cells': cells_excluded
        })

    }).catch(function (error) {
      return res.json({
        err: error,
        ok: false,
        message: "Error al procesar la query"
      })
    })
  
}


exports.getGridGeneratedSpecies = function(req, res) {
  
  debug("getGridGeneratedSpecies")

  var date = new Date()
  var day = date.getDate()
  var month = date.getMonth() + 1
  var year = date.getFullYear()

  var target_taxons     = getParam(req, 'target_taxons', [])
  var sfecha            = getParam(req, 'sfecha', false)
  var sfosil            = getParam(req, 'sfosil', false)
  var lim_inf           = getParam(req, 'liminf', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup           = getParam(req, 'limsup',  year+"-"+month+"-"+day)
  var grid_res          = getParam(req, 'grid_res', default_resolution)
  var region            = getParam(req, 'region', 1)
  var modifier          = getParam(req, 'modifier', 'cases')
  var traffic_light     = getParam(req, 'traffic_light', 'none')
  var lim_inf_first     = getParam(req, 'liminf_first', verb_utils.formatDate(new Date("1500-01-01")) )
  var lim_sup_first     = getParam(req, 'limsup_first',  lim_inf)


  debug("==> liminf: " + lim_inf)
  debug("==> limsup: " + lim_sup)
  debug("==> sfecha: " + sfecha)
  debug("==> sfosil: " + sfosil)
  debug("==> target_taxons", target_taxons)
  debug("==> traffic_light", traffic_light)


  var Ncells = 2458

  pool.task(t => {

    if(modifier == 'cases'){
      var query  = queries.getTimeValidation.getCountCellFirst
    } else if (modifier == 'incidence') {
      var query  = queries.getTimeValidation.getCountCellFirstIncidence
    } else if(modifier == 'lethality'){
      debug('Modificador: ' + modifier)
      var query  = queries.getTimeValidation.getCountCellFirstLethality
    } else if(modifier == 'negativity'){
      var query  = queries.getTimeValidation.getCountCellFirstNegativity
    } else {
      var query  = queries.getTimeValidation.getCountCellFirstPrevalence
    }

    var where_validation = verb_utils.getWhereClauseFromGroupTaxonArray(target_taxons, true)

    debug('==> where_validation =  ' + where_validation);

    const query1 = pgp.as.format(query, {

      where_target: where_validation.replace('WHERE', ''),
      grid_resolution: grid_res,
      lim_inf_first: lim_inf_first,
      lim_sup_first: lim_sup_first

    })
    debug(query1)

    return t.any(query,  {

      where_target: where_validation.replace('WHERE', ''),
      grid_resolution: grid_res,
      lim_inf_first: lim_inf_first,
      lim_sup_first: lim_sup_first

    }).then(resp => {

        var first = resp
        
        var first1s = 0;
        var first0s = 0;
        var first_presence = [] 
        
        first.forEach(item => {

          if(modifier == 'negativity'){
          
            first1s += 1;
            first_presence.push(item)

          }else {

            if(parseFloat(item['occ']) > 0) {
              
              first1s += 1;
              first_presence.push(item)

            } else {
              first0s += 1;
            }

          }

        });

        debug('first presence', first_presence.length)
        debug('0s:', first0s, '1s:', first1s, 'total:', first0s + first1s)

        var bin = 10
        var percentiles = 10
        var bining = 'percentile'

        var limits = []
        
        if(bining == 'percentile') {

          for(var i=0; i<=percentiles; i++) {

            var val = parseInt(Ncells*i/percentiles) - parseInt(i/percentiles)
            limits.push(val)

          }

          debug(limits)

          var first_cells = []
          var first_cells_values = []
          if(first1s >= parseInt(Ncells / percentiles)){

            for(var i=0; i<Ncells; i++){

              if(limits[bin-1] <= i && i <= limits[bin]) {

                first_cells.push(first[i]['gridid'])
                first_cells_values.push(first[i]['occ'])

              }

            }

          } else {

            first.forEach(item => {

              if(modifier == 'negativity'){
                
                first_cells.push(item['gridid'])
                first_cells_values.push(item['occ'])

              } else {

                if(parseFloat(item['occ']) > 0) {
                  first_cells.push(item['gridid']);
                  first_cells_values.push(item['occ'])
                } 

              }

            });

          }
            

        } else {
        }

        debug('MODIFIER', modifier)
        if(modifier == 'cases'){
          var query = queries.getTimeValidation.getCountCellTrainingTop
        } else if (modifier == 'incidence') {
          var query  = queries.getTimeValidation.getCountCellTrainingIncidence
        } else if (modifier == 'lethality') {
          var query  = queries.getTimeValidation.getCountCellTrainingLethality
        } else if (modifier == 'negativity') {
          var query  = queries.getTimeValidation.getCountCellTrainingNegativity
        } else {
          var query  = queries.getTimeValidation.getCountCellTrainingPrevalence
        }

        var where_validation = verb_utils.getWhereClauseFromGroupTaxonArray(target_taxons, true)

        const query1 = pgp.as.format(query, {

          where_target: where_validation.replace('WHERE', ''),
          grid_resolution: grid_res,
          lim_inf: lim_inf,
          lim_sup: lim_sup,
          first_cells: first_cells.length ==  0 ? '' : first_cells 

        })
        debug(query1)

         return t.any(query,  {
                where_target: where_validation.replace('WHERE', ''),
                grid_resolution: grid_res,
                lim_inf: lim_inf,
                lim_sup: lim_sup,
                first_cells: first_cells.length ==  0 ? '' : first_cells

        }).then(resp => {

          var training = resp
          var training_data = []

          var train1s = 0;
          var train0s = 0;
          var training_presence = []
          
          training.forEach(item => {

            /*if(!first_cells.includes(item['gridid'])){
              training_data.push(item)
            }*/

            training_data.push(item)

            if(parseFloat(item['occ']) > 0){
              training_presence.push(item)
            }

          });

          training_data.forEach(item => {

            if(modifier == 'negativity'){

              train1s += 1;

            } else {

              if(parseFloat(item['occ']) > 0) {
                train1s += 1;
              } else {
                train0s += 1;
              }

            }

          });

          debug('training presence', training_presence.length)
          debug('0s:', train0s, '1s:', train1s, 'total:', train0s + train1s)

          Ncells = train0s + train1s

          var limits = []
          var bin = 10
          var percentiles = 10
          var bining = 'percentile'
          var width_top = parseInt(2458/percentiles)

          if(bining == 'percentile') {
            
            var Ncells1 = Ncells - width_top - 1

            for(var i=0; i<percentiles-1; i++) {

              var val = parseInt(Ncells1*i/percentiles) - parseInt(i/percentiles)
              //limits.push(parseInt(training[val]['occ']))
              limits.push(val)

            }

            limits.push(Ncells1)
            limits.push(Ncells - 1)

            debug(limits)

            var training_cells = []
            var training_cells_values = []
            if (train1s >= parseInt(Ncells / percentiles)) {

              for(var i=0; i<Ncells; i++){

                if(limits[bin-1] <= i && i <= limits[bin]) {

                  training_cells.push(training_data[i]['gridid'])
                  training_cells_values.push(training_data[i]['occ'])

                }
              }

            } else {

              training_data.forEach(item => {

                if(modifier == 'negativity'){

                  training_cells.push(item['gridid'])
                  training_cells_values.push(item['occ'])

                } else {

                  if(parseFloat(item['occ']) > 0) {
                    training_cells.push(item['gridid'])
                    training_cells_values.push(item['occ'])
                  } 

                }

              });

            }

          } else {

          }

          var cells = {}
          var limits = []


          for(var i=0; i<percentiles+1; i++) {

            var val = parseInt(Ncells*i/percentiles) - parseInt(i/percentiles)
            limits.push(val)

          }

          debug(limits)

          var index_bin = 1

          for(var i=0; i<Ncells; i++){

            if(i <= limits[index_bin]){
              first[i]['bin'] = index_bin
              training[i]['bin'] = index_bin
            }

            if(i == limits[index_bin]){
              index_bin += 1
            }

          }

          first.forEach(item => {

            cells[item['gridid']] = {
              gridid: item['gridid'],
              fp: 0,
              tp: 0,
              fv: parseFloat(item['occ'])*(modifier=='cases' ? 1: 1000),
              tv: 0,
              fb: item['bin'],
              tb: 1,
              target: false
            }

          })

          training.forEach(item => {

            if(cells[item['gridid']] == null){
              cells[item['gridid']] = {
                gridid: item['gridid'],
                fp: 0,
                tp: 0,
                fv: 0,
                tv: parseFloat(item['occ'])*(modifier=='cases' ? 1: 1000),
                fb: 1, 
                tb: item['bin'],
                target: false
              }
            } else {
              cells[item['gridid']]['tv'] = parseFloat(item['occ'])*(modifier=='cases' ? 1: 1000)
              cells[item['gridid']]['tb'] = parseFloat(item['bin'])
            }

          })

          var n_fp = first_cells.length
          var n_tp = training_cells.length

          debug('First period cells ' + n_fp)
          debug('Training period cells ' + n_tp)


          for(var i = 0; i < n_fp; i++) {

            if(cells[first_cells[i]] == null){
              cells[first_cells[i]] = {
                gridid: first_cells[i],
                fp: 1,
                tp: 0,
                fv: first_cells_values[i],
                tv: 0,
                target: false
              }
            } else {

              cells[first_cells[i]]['fp'] = 1
              cells[first_cells[i]]['fv'] = first_cells_values[i]*(modifier=='cases' ? 1: 1000)
            }

          }

          for(var i = 0; i < n_tp; i++){

            if(cells[training_cells[i]] == null){
              cells[training_cells[i]] = {
                gridid: training_cells[i],
                fp: 0,
                tp: 1,
                fv: 0, 
                tv: training_cells_values[i],
                target: false
              } 
            } else {
              cells[training_cells[i]]['tp'] = 1
              cells[training_cells[i]]['tv'] = training_cells_values[i]*(modifier=='cases' ? 1: 1000)
            }

          }

          //debug(training_cells)
          //debug(cells)

          var target_cells = 0
          var no_target_cells = 0
          var excluded_cells = 0
          cells = Object.values(cells)

          if(traffic_light == 'red'){

            cells.forEach(item => {

              if(item['fp'] == 0 && item['tp'] == 1){

                item['target'] = true
                target_cells += 1

              } else if(item['fp'] == 0 ){

                excluded_cells += 1
                no_target_cells += 1

              } else {

                no_target_cells += 1

              }

            })

          } else if(traffic_light == 'green'){

            cells.forEach(item => {

              if(item['fp'] == 1 && item['tp'] == 0) {
                item['target'] = true
                target_cells += 1
              } else if(item['fp'] == 1) {

                excluded_cells += 1
                no_target_cells += 1

              } else {
                no_target_cells += 1
              }
            
            })

          } else {

            cells.forEach(item => {

              if(item['tp'] == 1) {
                item['target'] = true
                target_cells += 1
              } else {
                no_target_cells += 1
              }
            
            })

          }

          return res.json({
            ok: true,
            data: cells,
            target_cells: target_cells,
            no_target_cells: no_target_cells,
            excluded_cells: excluded_cells
          })

        })

    })



  }).catch(error => {

    res.json({
        ok: false,
        message: "Error al ejecutar la petición",
        data:[],
        error: error
      })

  })

}

exports.getCountByYear = function(req, res) {

  debug("getCountByYear")
  
  var target_taxons     = getParam(req, 'target_taxons')
  var sfecha            = getParam(req, 'sfecha', false)
  var sfosil            = getParam(req, 'sfosil', false)
  var liminf            = getParam(req, 'liminf', 1500)
  var limsup            = getParam(req, 'limsup', new Date().getFullYear())
  var grid_res          = getParam(req, 'grid_res', 16)
  var region            = getParam(req, 'region', 1)

  var species_filter  = verb_utils.getWhereClauseFromGroupTaxonArray(target_taxons, true)
  var resolution_view = 'grid_geojson_' + grid_res + 'km_aoi'
  var gridid          = 'gridid_' + grid_res + 'km'
  var snib_grid_xxkm  = 'snib_grid_' + grid_res + 'km'
  var where_filter    = ''
  var where_filter_fosil    = ''

  if (sfecha){
    where_filter += ' AND ( ( aniocolecta BETWEEN ' + liminf + ' AND ' + limsup + ' ) OR aniocolecta = 9999 )'
    where_filter_fosil += ' AND ( ( aniocolecta BETWEEN ' + liminf + ' AND ' + limsup + ' ) OR aniocolecta = 9999 )'
  }
  else{
    // Esta condicion esta filtrando tmb los fosiles, ya que los registros fosiles tienen año 9999
    where_filter += ' AND ( aniocolecta BETWEEN ' + liminf + ' AND ' + limsup + ' ) ' 
    where_filter_fosil += ' AND ( aniocolecta BETWEEN ' + liminf + ' AND ' + limsup + ' ) ' 
    
    if(sfosil){
      where_filter_fosil += " OR ejemplarfosil = 'SI'"
    }

  }

  if(!sfosil){
    where_filter += " AND (ejemplarfosil != 'SI' or ejemplarfosil isnull)"
    where_filter_fosil += " AND (ejemplarfosil != 'SI' or ejemplarfosil isnull)"
  }
  else{
    // TODO: Se debe validar si se piden o no foisles y agregar la sentencia de OR ejemplarfosil = 'SI'
    if(sfecha){
      where_filter += " OR ejemplarfosil = 'SI'"  
    }
    
  }

  where_filter_fosil += " AND (ejemplarfosil = 'SI') "
    
  

  /*const query1 = pgp.as.format(queries.basicAnalysis.getCountByYear, {'species_filter' : species_filter, 
            'resolution_view': resolution_view,
            'region'         : region,
            'gridid'         : gridid,
            'snib_grid_xxkm' : snib_grid_xxkm,
            'where_filter'   : where_filter})
  debug(query1)*/

  debug("species_filter: " + species_filter)
  debug("snib_grid_xxkm: " + snib_grid_xxkm)
  debug("where_filter: " + where_filter)
  debug("where_filter_fosil: " + where_filter_fosil)
  debug("gridid: " + gridid)
  debug("resolution_view: " + resolution_view)

  pool.any(queries.basicAnalysis.getCountByYear, {
            'species_filter' : species_filter, 
            'resolution_view': resolution_view,
            'region'         : region,
            'gridid'         : gridid,
            'snib_grid_xxkm' : snib_grid_xxkm,
            'where_filter'   : where_filter,
            'where_filter_fosil' : where_filter_fosil}
      ).then(function (data) {
        // debug(data.length + ' ocurrence years')
        res.json({
          ok: true,
          'data': data
        })
    }).catch(function (error) {
      return res.json({
        err: error,
        ok: false,
        message: "Error al procesar la query"
      })
    })

}


exports.getCellOcurrences = function(req, res) {

  debug("getCellOcurrences")

  var date = new Date()
  var day = date.getDate()
  var month = date.getMonth() + 1
  var year = date.getFullYear()
  
  var target_taxons     = getParam(req, 'target_taxons')
  var sfecha            = false //getParam(req, 'sfecha', false)
  // var sfosil            = getParam(req, 'sfosil', false)
  var liminf            = getParam(req, 'lininf', verb_utils.formatDate(new Date("1500-01-01")) )
  var limsup            = getParam(req, 'limsup',  year+"-"+month+"-"+day)
  // var liminf            = getParam(req, 'liminf', 1500)
  // var limsup            = getParam(req, 'limsup', new Date().getFullYear())
  var grid_res          = getParam(req, 'grid_res', default_resolution)
  var region            = getParam(req, 'region', default_region)
  var longitud          = getParam(req, 'longitud', 0)
  var latitud           = getParam(req, 'latitud', 0)

  debug("res: " + grid_res)

  var col_name = ""
  if(grid_res == "mun")
    col_name = "NOM_MUN"
  else if(grid_res == "state" || grid_res == "ageb")
     col_name = "NOM_ENT"
   else
     col_name = ""
  
  var species_filter  = verb_utils.getWhereClauseFromGroupTaxonArray(target_taxons, true)
  var resolution_view = 'grid_geojson_' + grid_res + 'km_aoi'
  var gridid          = 'gridid_' + grid_res + 'km'
  var where_filter    = ''
  var grid_table      = 'grid_'+ grid_res + 'km_aoi'


  where_filter = " and (make_date(aniocolecta, mescolecta, diacolecta) between "
                + "'" + liminf + "' and '" + limsup + "'"
                + " and diacolecta <> 99 and diacolecta <> -1"
                + " and mescolecta <> 99 and mescolecta <> -1"
                + " and aniocolecta <> 9999 and aniocolecta <> -1)"

  if(sfecha === true){
    where_filter += " or (true and a.gridid_"+grid_res+"km is not null)"
  }

  
  const query1 = pgp.as.format(queries.basicAnalysis.getCellOcurrences, 
           {'species_filter' : species_filter, 
            'resolution_view': resolution_view,
            'region'         : region,
            'gridid'         : gridid,
            'grid_table'     : grid_table,
            'where_filter'   : where_filter,
            'longitud'       : longitud,
            'latitud'       : latitud,
            'col_name'      : col_name})
  debug(query1)

  debug("region: " + region)
  debug("species_filter: " + species_filter)
  debug("resolution_view: " + resolution_view)
  debug("gridid: " + gridid)
  debug("grid_table: " + grid_table)
  debug("where_filter: " + where_filter)
  debug("longitud: " + longitud)
  debug("latitud: " + latitud)
  debug("col_name: " + col_name)
  

  pool.any(queries.basicAnalysis.getCellOcurrences, {
            'species_filter' : species_filter, 
            'resolution_view': resolution_view,
            'region'         : region,
            'gridid'         : gridid,
            'grid_table'     : grid_table,
            'where_filter'   : where_filter,
            'longitud'       : longitud,
            'latitud'       : latitud,
            'col_name'      : col_name}
      ).then(function (data) {
        debug(data.length + ' ocurrences')
        res.json({
          ok: true,
          'data': data
        })
    }).catch(function (error) {
      return res.json({
        err: error,
        ok: false,
        message: "Error al procesar la query"
      })
    })

}



exports.getIDCellFromCoordinates =  function(req, res) {

  debug("getIDCellFromCoordinates")
  
  var longitud   = getParam(req, 'longitud')
  var latitud    = getParam(req, 'latitud')
  var resolution = getParam(req, 'res')

  pool.any(queries.getCells.fromCoordinates, {
    longitud: longitud,
    latitud : latitud,
    res: resolution
  }).then(function (data) {

    data.forEach(function (element){
      element['the_geom'] = JSON.parse(element['the_geom'])
    })
    
    res.json({
      ok: true,
      'data': data
    })
    
  }).catch(function (error) {
    res.json({
        ok: false,
        err: error,
        data: [],
        message: "Error al procesar la query"
      })
  })

}


exports.sendFeedBack = function(req, res){

   debug("sendBackFeed")
  
   var rating     = getParam(req, 'rating');
   var comment    = getParam(req, 'comment');
   var to         = getParam(req, 'to');

   /*debug(rating)
   debug(comment)
   debug(to)*/

   var transporter = nodeMailer.createTransport({
          host: email_config['host'],
          port: email_config['port'],
          auth: {
              user: email_config['user'],
              pass: email_config['pass']
          }
   });

   var mailOptions = {
      from: email_config['user'],
      to: [to, email_config['user']],
      subject: 'Retroalimentación',
      html: `<div style="text-align:center;"> 
              <p><b>SPECIES recibió una retroalimentación:</b></p> 
              <p><b>Calificación:</b> ${rating} </p>
              <p><b>Comentario:</b> ${comment}</p>
            </div>`,
   };

   transporter.sendMail(mailOptions, (error, info) => {
   
      if (error) {
        debug(error);

        return res.json({
          ok: false,
          err: error,
          message: "Error al enviar retroalimentación"
        });

      } else {

        debug('Message %s sent: %s', info.messageId, info.response);

        pool.any(queries.users.saveFeedBack, 
                      {
                        rating: rating, 
                        comment: comment,
                        email: to})
        .then(function (data) {

          return res.json({
            ok: true,
            message: "Retroalimentación enviada correctamente"
          });

        })
        .catch(function (error) {
          debug(error)

          return res.json({
            ok: false,
            err: error,
            message: "Error al enviar retroalimentación"
          });
        });

      }
   
   });


}


exports.getColumnsGrid = function(req, res, next){

    debug('getColumnsGrid')

    var grid_resolution = verb_utils.getParam(req, 'grid_resolution', 16)
    var columns = verb_utils.getParam(req, 'columns', [])
    var gridids = verb_utils.getParam(req, 'gridids', [])
    var where = ''

    debug(grid_resolution)
    debug(columns)
    debug(gridids)

    var columns_string = ''

    columns.forEach(colum => {

      columns_string += '"' + colum + '", '

    })

    if(gridids.length == 0) {

      where = ''

    } else {


      where = ' WHERE gridid_' + grid_resolution + 'km = ANY(array[' + gridids.toString() + ']::integer[])'

    }

     pool.task(t => {

      var query = queries.grid.getColumnsGrid

      const query1 = pgp.as.format(query, {

        grid_resolution: grid_resolution,
        columns: columns_string,
        where_filter: where

      })
      debug(query1)

      return t.any(query, {

        grid_resolution: grid_resolution,
        columns: columns_string,
        where_filter: where

      }).then(data => {

        res.json({

          ok: true,
          data: data

        })

      })

    }).catch(error => {

      debug(error)
    
      res.json({
          ok: false,
          message: "Error al ejecutar la petición",
          data:[],
          error: error
      })      

    })


  }

exports.getGivenPointaValidationTables = function(req, res, next){


  debug('getGivenPointaValidationTables')

  var idtbl =  'tbl_' + new Date().getTime() 
  var iter = getParam(req, 'iterations',iterations)

  var grid_resolution = parseInt(verb_utils.getParam(req, 'grid_resolution', 16)) 
  var fosil = verb_utils.getParam(req, 'fosil', true)
  var date  = verb_utils.getParam(req, 'date', true)
  var lim_inf = verb_utils.getParam(req, 'lim_inf', 1500)
  var lim_sup = verb_utils.getParam(req, 'lim_sup', 2020)
  var target_points = verb_utils.getParam(req, 'target_points', [])
  var region = parseInt(getParam(req, 'region', default_region))
  
  var points = '['
  var number_occ = 0

  target_points.forEach(function(occ) {
    
    if(fosil){

      if(date){

        if((occ['anio'] >= lim_inf && occ['anio'] <= lim_sup) || occ['anio'] == 9999){
          
          if(number_occ > 0) {
            points += ', '
          }  

          points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
          number_occ += 1

        }
        

      } else { 

          if(occ['anio'] >= lim_inf && occ['anio'] <= lim_sup){

            if(number_occ > 0) {
              points += ', '
            } 

            points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
            number_occ += 1
          
          }

    }

  } else {

      if(!occ['fosil']){

        if(date){

          if((occ['anio'] >= lim_inf && occ['anio'] <= lim_sup) || occ['anio'] !== 9999){
          
            if(number_occ > 0) {
              points += ', '
            }  

            points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
            number_occ += 1

          }

        } else {

            if(occ['anio'] >= lim_inf && occ['anio'] <= lim_sup){

              if(number_occ > 0) {
                points += ', '
              }  

              points += 'ST_SetSRID('+ 'ST_Point('+ occ['longitud'] + ', ' + occ['latitud'] +')' +', 4326)'
              number_occ += 1
            
            }

       }

      }  

  }

  });

  points += ']'

  pool.task(t => {

    var query = queries.countsTaxonGroups.getCellSincePoint

    /*const query1 = pgp.as.format(query, {

      res: grid_resolution,
      points: points

    })
    debug(query1)*/

    return t.any(query, {

      res: grid_resolution,
      points: points

    }).then(data => {


      var target_cells = []

      data.forEach(item => {
        target_cells.push(item['gridid'])
      });

      const unique_set = new Set(target_cells)
      target_cells = Array.from(unique_set)

      debug(target_cells.length)  

      const query1 = pgp.as.format(queries.getValidationTables.createGivenPointsTables, {

        iterations: iter,
        idtbl: idtbl,
        res: grid_resolution,
        target_cells: '[' + target_cells.toString() + ']',
        res_celda_snib_tb: 'grid_geojson_' + grid_resolution + 'km_aoi',
        region: region

    })
    //debug(query1)

      pool.any(queries.getValidationTables.createGivenPointsTables, {
        iterations: iter,
        idtbl: idtbl,
        res: grid_resolution,
        target_cells: '[' + target_cells.toString() + ']',
        region: region,
        res_celda_snib_tb: 'grid_geojson_' + grid_resolution + 'km_aoi'
      }).then(function (data) {

          var item = data[0]
          item['tblname'] = idtbl
          
          debug(data)

          res.json({'data': data})
        })

    }).catch(error => {

      debug(error)
      
      res.json({
            ok: false,
            message: "Error al ejecutar la petición",
            data:[],
            error: error
          })

  });



  }).catch(error => {

    debug(error)
    
    res.json({
          ok: false,
          message: "Error al ejecutar la petición",
          data:[],
          error: error
        })

  });
        

}


exports.getModifiersByTarget = function(req, res, next){

  debug('getModifiersByTarget');

  var target_taxons = getParam(req, 'target_taxons', [])

  if(target_taxons.length == 0){

    res.json({"modifiers": []})

  } else {

    const query = queries.countsTaxonGroups.getModifiersByTarget
    var especievalidabusqueda = ''
    var es_pruebas = 'false'

    if(target_taxons.length == 1){

      especievalidabusqueda = target_taxons[0].value

    } else if(target_taxons.length == 2){

      if((target_taxons[0].value == 'COVID-19 CONFIRMADO' && target_taxons[1].value == 'COVID-19 NEGATIVO') 
        || (target_taxons[1].value == 'COVID-19 CONFIRMADO' && target_taxons[0].value == 'COVID-19 NEGATIVO')) {

        es_pruebas = 'true'

      } else {
        res.json({"modifiers": []})
      }

    }

    pool.task(t => {

      return t.any(query, {

        especievalidabusqueda: especievalidabusqueda,
        es_pruebas: es_pruebas

      }).then(data => {

        res.json({'modifiers': data})

      }).catch(error => {

        debug(error)
        
        res.json({
              ok: false,
              message: "Error al ejecutar la petición",
              data:[],
              error: error
            })
      });

    }).catch(error => {

      debug(error)
      
      res.json({
            ok: false,
            message: "Error al ejecutar la petición",
            data:[],
            error: error
          })
    });

  }

}


