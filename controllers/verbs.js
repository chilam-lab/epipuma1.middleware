/**
* Verbs module
* @module controllers/verbs
*/
var debug = require('debug')('verbs')
var pgp = require('pg-promise')()
var moment = require('moment')
var verb_utils = require('./verb_utils')

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

  // console.log("getStates");

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

  // console.log("getUserReg");
  
  var user_email = getParam(req, 'email');

  pool.any(queries.users.getUser, {email: user_email})
    .then(function (data) {
      res.json({'data': data})
    })
    .catch(function (error) {
      next(error)
    })
};





/**
 *
 * getGeoRel_VAT de SNIB DB, considerando validacion y tiempo
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRel_VT = function (req, res, next) {


    console.log("getGeoRel_VT");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;
    var discardedFilterids;


    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);
    

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var discardedids    = getParam(req, 'discardedids', []);
    
    // filtros por tiempo
    var sfecha        = getParam(req, 'sfecha', false);
    var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin     = moment(getParam(req, 'lim_sup', Date.now()), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');

    // Si se realiza filtro de tiempo existen celdas descartadas por filtro
    //if(sfecha || fecha_incio != '1500' || fecha_fin != moment(Date.now(), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')){
    var discardedFilterids = getParam(req, 'discardedFilterids');
    //}

    var discardedids_total = discardedFilterids.concat(discardedids); 
    // console.log(discardedids);
    // console.log(discardedFilterids);

    var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


    if (hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined ){

      console.log("TVT");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);


      pool.any(queries.specie.getGeoRelVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString(),
        arg_gridfilterids: discardedFilterids.toString(),
        arg_gridids_total: discardedids_total.toString(),
        filter_dates: filterDates
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        
        console.log(error);
        next(error)

      })

      
    }
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined ){

      console.log("BVT");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);

      
      pool.any(queries.specie.getGeoRelBioVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString(),
        arg_gridfilterids: discardedFilterids.toString(),
        arg_gridids_total: discardedids_total.toString(),
        filter_dates: filterDates
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        
        console.log(error);
        next(error)

      })

      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined ){

      console.log("RaVT");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.specie.getGeoRelRaVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString(),
        arg_gridfilterids: discardedFilterids.toString(),
        arg_gridids_total: discardedids_total.toString(),
        filter_dates: filterDates
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        
        console.log(error);
        next(error)

      })

      
    } 
    else{

      next();
    }

};





/**
 *
 * getGeoRel_V de SNIB DB, considerando validacion
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRel_V = function (req, res, next) {

    console.log("getGeoRel_V");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);
    

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var discardedids    = getParam(req, 'discardedids', []);

    // console.log(hasBios);
    // console.log(hasRaster);
    // console.log(discardedids.length);

    // var str_gridids = discardedids.toString();
    
    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("TV");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.specie.getGeoRelV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        
        console.log(error);
        next(error)

      })

      
    }
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("BV");

      var whereVar = "";

      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }


      //console.log(whereVar);
      //console.log(discardedids.toString());


      pool.any(queries.specie.getGeoRelBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        
        console.log(error);
        next(error)

      })


      
    } 
    else if ( hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("RaV");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      // console.log(whereVarRaster);

      pool.any(queries.specie.getGeoRelRasterV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        
        console.log(error);
        next(error)

      })

      
    } 
    else{

      next();
    }

};


/**
 *
 * getGeoRel_T de SNIB DB, considerando tiempo
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRel_T = function (req, res, next) {

    console.log("getGeoRel_T");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);
    

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    

    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', Date.now()), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');

    var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TT");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.specie.getGeoRelT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        filter_dates: filterDates,
        arg_gridids: discardedFilterids.toString()
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        
        console.log(error);
        next(error)

      })

      
    }
    else if (hasBios === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("BT");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);

      pool.any(queries.specie.getGeoRelBioT, {
          spid: spid,
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config: whereVar,
          filter_dates: filterDates,
          arg_gridids: discardedFilterids.toString()
      })
      .then(function (data) {
          res.json({'data': data})
      })
      .catch(function (error) {
          // console.log(error);
          next(error)
      })

      
    } 
    else if (hasRaster === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("RaT");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.specie.getGeoRelRasterT, {
          spid: spid,
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_raster: whereVarRaster,
          filter_dates: filterDates,
          arg_gridids: discardedFilterids.toString()
      })
      .then(function (data) {
          res.json({'data': data})
      })
      .catch(function (error) {
          // console.log(error);
          next(error)
      })

      
    } 
    else{

      next();
    }

};


/**
 *
 * getGeoRel de SNIB DB, sin filtros
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRel = function (req, res, next) {

    console.log("getGeoRel");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    console.log(hasBios);
    console.log(hasRaster);
    
    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.specie.getGeoRel, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true'){

      console.log("B");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);

      pool.any(queries.specie.getGeoRelBio, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        // console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      console.log(whereVarRaster);

      pool.any(queries.specie.getGeoRelRaster, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else{

      next();
    }

};



// *************** Funciones por ser definidas 

// /**
//  *
//  * getGeoRel_VAT de SNIB DB, validacion, apriori y tiempo
//  *
//  * Obtiene epsilon y score con especie objetivo y conjunto de variables bioticas y raster, (Contempla todas las variables)
//  *
//  * @param {express.Request} req
//  * @param {express.Response} res
//  *
//  */

// exports.getGeoRel_VAT = function (req, res, next) {

//     console.log("getGeoRel_VAT");
//     console.log(req.body);

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;
//     var discardedFilterids;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);
    

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     var discardedids    = getParam(req, 'discardedids', []);
//     var apriori         = getParam(req, 'apriori');
//     // var mapa_prob       = getParam(req, 'mapa_prob');

//     // filtros por tiempo
//     var sfecha        = getParam(req, 'sfecha', false);
//     var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
//     var fecha_fin     = moment(getParam(req, 'lim_sup', Date.now()), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');

//     // Si se realiza filtro de tiempo existen celdas descartadas por filtro
//     if(sfecha || 
//         fecha_incio != '1500' || 
//           fecha_fin != moment(Date.now(), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')){

//       discardedFilterids = getParam(req, 'discardedFilterids', []);
//     }


//     if (hasBios && hasRaster && discardedids.length > 0 && apriori && discardedFilterids.length > 0){

//       console.log("TVAT");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     }
//     else if (hasBios && discardedids.length > 0 && apriori && discardedFilterids.length > 0){

//       console.log("BVAT");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else if (hasRaster && discardedids.length > 0 && apriori && discardedFilterids.length > 0){

//       console.log("RaVAT");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else{

//       next();
//     }

// };

// /**
//  *
//  * getGeoRel_VAT de SNIB DB, validacion, mapa y tiempo
//  *
//  * Obtiene epsilon y score con especie objetivo y conjunto de variables bioticas y raster.
//  *
//  * @param {express.Request} req
//  * @param {express.Response} res
//  *
//  */

// exports.getGeoRel_VMT = function (req, res, next) {

//     console.log("getGeoRel_VMT");

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;
//     var discardedFilterids;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);
    

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     var discardedids    = getParam(req, 'discardedids', []);
//     // var apriori         = getParam(req, 'apriori');
//     var mapa_prob       = getParam(req, 'mapa_prob');

//     // filtros por tiempo
//     var sfecha        = getParam(req, 'sfecha', false);
//     var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
//     var fecha_fin     = moment(getParam(req, 'lim_sup', Date.now()), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');

//     // Si se realiza filtro de tiempo existen celdas descartadas por filtro
//     if(sfecha || 
//         fecha_incio != '1500' || 
//           fecha_fin != moment(Date.now(), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')){

//       discardedFilterids = getParam(req, 'discardedFilterids',[]);
//     }


//     if (hasBios && hasRaster && discardedids.length > 0 && mapa_prob && discardedFilterids.length > 0){

//       console.log("TVAT");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     }
//     else if (hasBios && discardedids.length > 0 && mapa_prob && discardedFilterids.length > 0){

//       console.log("BVAT");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else if (hasRaster && discardedids.length > 0 && mapa_prob && discardedFilterids.length > 0){

//       console.log("RaVAT");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else{

//       next();
//     }

// };


// /**
//  *
//  * getGeoRel_VAT de SNIB DB, validacion y apriori
//  *
//  * Obtiene epsilon y score con especie objetivo y conjunto de variables bioticas y raster.
//  *
//  * @param {express.Request} req
//  * @param {express.Response} res
//  *
//  */

// exports.getGeoRel_VA = function (req, res, next) {

//     console.log("getGeoRel_VA");

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;
//     var discardedFilterids;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);
    

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     var discardedids    = getParam(req, 'discardedids', []);
//     var apriori         = getParam(req, 'apriori');
    

//     if (hasBios && hasRaster && discardedids.length > 0 && apriori ){

//       console.log("TVA");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     }
//     else if (hasBios && discardedids.length > 0 && apriori ){

//       console.log("BVA");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else if (hasRaster && discardedids.length > 0 && apriori ){

//       console.log("RaVA");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else{

//       next();
//     }

// };


// /**
//  *
//  * getGeoRel_VAT de SNIB DB, validacion y mapa
//  *
//  * Obtiene epsilon y score con especie objetivo y conjunto de variables bioticas y raster.
//  *
//  * @param {express.Request} req
//  * @param {express.Response} res
//  *
//  */

// exports.getGeoRel_VM = function (req, res, next) {

//     console.log("getGeoRel_VM");

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;
//     var discardedFilterids;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);
    

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     var discardedids    = getParam(req, 'discardedids', []);
//     var mapa_prob       = getParam(req, 'mapa_prob');
    

//     if (hasBios && hasRaster && discardedids.length > 0 && mapa_prob ){

//       console.log("TVAT");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     }
//     else if (hasBios && discardedids.length > 0 && mapa_prob ){

//       console.log("BVAT");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else if (hasRaster && discardedids.length > 0 && mapa_prob ){

//       console.log("RaVAT");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else{

//       next();
//     }

// };



// /**
//  *
//  * getGeoRel_VAT de SNIB DB, tiempo y apriori
//  *
//  * Obtiene epsilon y score con especie objetivo y conjunto de variables bioticas y raster.
//  *
//  * @param {express.Request} req
//  * @param {express.Response} res
//  *
//  */

// exports.getGeoRel_TA = function (req, res, next) {

//     console.log("getGeoRel_TA");

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;
//     var discardedFilterids;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);
    

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     // var discardedids    = getParam(req, 'discardedids', []);
//     var apriori         = getParam(req, 'apriori');

    
//     // filtros por tiempo
//     var sfecha        = getParam(req, 'sfecha', false);
//     var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
//     var fecha_fin     = moment(getParam(req, 'lim_sup', Date.now()), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');

//     // Si se realiza filtro de tiempo existen celdas descartadas por filtro
//     if(sfecha || 
//         fecha_incio != '1500' || 
//           fecha_fin != moment(Date.now(), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')){

//       discardedFilterids = getParam(req, 'discardedFilterids');
//     }
    



//     if (hasBios && hasRaster && apriori && discardedFilterids.length > 0 ){

//       console.log("TTA");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     }
//     else if (hasBios && apriori && discardedFilterids.length > 0 ){

//       console.log("BTA");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else if (hasRaster && apriori && discardedFilterids.length > 0 ){

//       console.log("RaTA");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else{

//       next();
//     }

// };



// *
//  *
//  * getGeoRel_VAT de SNIB DB, tiempo y mapa
//  *
//  * Obtiene epsilon y score con especie objetivo y conjunto de variables bioticas y raster.
//  *
//  * @param {express.Request} req
//  * @param {express.Response} res
//  *
 

// exports.getGeoRel_TM = function (req, res, next) {

//     console.log("getGeoRel_TM");

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;
//     var discardedFilterids;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);
    

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     // var discardedids    = getParam(req, 'discardedids', []);
//     var mapa_prob       = getParam(req, 'mapa_prob');

    
//     // filtros por tiempo
//     var sfecha        = getParam(req, 'sfecha', false);
//     var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
//     var fecha_fin     = moment(getParam(req, 'lim_sup', Date.now()), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');

//     // Si se realiza filtro de tiempo existen celdas descartadas por filtro
//     if(sfecha || 
//         fecha_incio != '1500' || 
//           fecha_fin != moment(Date.now(), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es')){

//       discardedFilterids = getParam(req, 'discardedFilterids');
//     }
    



//     if (hasBios && hasRaster && mapa_prob && discardedFilterids.length > 0 ){

//       console.log("TTM");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     }
//     else if (hasBios && mapa_prob && discardedFilterids.length > 0 ){

//       console.log("BTM");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else if (hasRaster && mapa_prob && discardedFilterids.length > 0 ){

//       console.log("RaTM");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else{

//       next();
//     }

// };


// /**
//  *
//  * getGeoRel_VAT de SNIB DB, apriori
//  *
//  * Obtiene epsilon y score con especie objetivo y conjunto de variables bioticas y raster.
//  *
//  * @param {express.Request} req
//  * @param {express.Response} res
//  *
//  */

// exports.getGeoRel_A = function (req, res, next) {

//     console.log("getGeoRel_A");

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     var apriori         = getParam(req, 'apriori');
    
    
//     if (hasBios && hasRaster && apriori ){

//       console.log("TA");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     }
//     else if (hasBios && apriori ){

//       console.log("BA");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else if (hasRaster && apriori ){

//       console.log("RaA");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else{

//       next();
//     }

// };


// *
//  *
//  * getGeoRel_VAT de SNIB DB, mapa
//  *
//  * Obtiene epsilon y score con especie objetivo y conjunto de variables bioticas y raster.
//  *
//  * @param {express.Request} req
//  * @param {express.Response} res
//  *
 

// exports.getGeoRel_M = function (req, res, next) {

//     console.log("getGeoRel_M");

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     var mapa_prob       = getParam(req, 'mapa_prob');
    
    
//     if (hasBios && hasRaster && mapa_prob ){

//       console.log("TM");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     }
//     else if (hasBios && mapa_prob ){

//       console.log("BM");
//       var whereVar = verb_utils.processBioFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else if (hasRaster && mapa_prob ){

//       console.log("RaM");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // TODO:

      
//     } 
//     else{

//       next();
//     }

// };







