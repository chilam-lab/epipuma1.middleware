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


/******************************************************************** getFGeoRel */



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
    var discardedFilterids = getParam(req, 'discardedFilterids');
    
    // filtros por tiempo
    var sfecha        = getParam(req, 'sfecha', false);
    var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin     = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');




    if (hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined ){


      
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);



      console.log("TVT");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);


      pool.any(queries.getGeoRel.getGeoRelVT, {
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

      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      
      pool.any(queries.getGeoRel.getGeoRelBioVT, {
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

      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getGeoRel.getGeoRelRaVT, {
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

      pool.any(queries.getGeoRel.getGeoRelV, {
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


      // console.log(whereVar);
      // console.log(discardedids.toString());


      pool.any(queries.getGeoRel.getGeoRelBioV, {
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

      pool.any(queries.getGeoRel.getGeoRelRasterV, {
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
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');

    
    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TT");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getGeoRel.getGeoRelT, {
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

      console.log(fecha_incio.valueOf());


      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getGeoRel.getGeoRelBioT, {
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
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getGeoRel.getGeoRelRasterT, {
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

    // console.log(hasBios);
    // console.log(hasRaster);
    
    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getGeoRel.getGeoRel, {
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

      pool.any(queries.getGeoRel.getGeoRelBio, {
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
        console.log(error);
        next(error)
      })
      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getGeoRel.getGeoRelRaster, {
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



/******************************************************************** getFreq */


/**
 *
 * getFreq_VT de SNIB DB, considerando validacion y tiempo
 *
 * Obtiene la frecuencia del score obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreq_VT = function (req, res, next) {


    console.log("getFreq_VT");

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
    var discardedFilterids = getParam(req, 'discardedFilterids');
    
    // filtros por tiempo
    var sfecha        = getParam(req, 'sfecha', false);
    var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin     = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');


    if (hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined ){



      console.log("TVT");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      

      pool.any(queries.getFreq.getFreqVT, {
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
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


      pool.any(queries.getFreq.getFreqBioVT, {
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
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      
      pool.any(queries.getFreq.getFreqRaVT, {
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
 * getFreq de SNIB DB, con validación
 *
 * Obtiene la frecuencia del score obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreq_V = function (req, res, next) {

    console.log("getFreq_V");

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
    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){
    
      console.log("TV");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreq.getFreqV, {
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
    else if (hasBios === "true" && discardedids != undefined && discardedids.length > 0){
    // else if (hasBios === 'true'){

      console.log("BV");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);

      pool.any(queries.getFreq.getFreqBioV, {
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
        // console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0){
    // else if (hasRaster === 'true'){

      console.log("RaV");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreq.getFreqRasterV, {
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
 * getFreq de SNIB DB, con filtro de tiempos NO EXISTE IMPLEMENTACION
 *
 * Obtiene la frecuencia del score obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreq_T = function (req, res, next) {

    console.log("getFreq_T");

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
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');


    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TT");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getFreq.getFreqT, {
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
    // else if (hasBios === 'true'){

      console.log("BT");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      // console.log(filterDates);

      pool.any(queries.getFreq.getFreqBioT, {
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
    else if (hasRaster === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){
    // else if (hasRaster === 'true'){

      console.log("RaT");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getFreq.getFreqRasterT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        filter_dates: filterDates,
        arg_gridids: discardedFilterids.toString(),
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



/**
 *
 * getFreq de SNIB DB, sin filtros
 *
 * Obtiene la frecuencia del score obtenido de las especies, sin utilzar filtros
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreq = function (req, res, next) {

    console.log("getFreq");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    // console.log(hasBios);
    // console.log(hasRaster);
    
    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreq.getFreq, {
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

      pool.any(queries.getFreq.getFreqBio, {
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
      // console.log(whereVarRaster);

      pool.any(queries.getFreq.getFreqRaster, {
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



/******************************************************************** getFreqCelda */



exports.getFreqCelda_VTA = function (req, res, next) {

    console.log("getFreqCelda_VTA");
    
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
    var discardedFilterids = getParam(req, 'discardedFilterids');
    var apriori         = getParam(req, 'apriori');

    

    // filtros por tiempo
    var sfecha        = getParam(req, 'sfecha', false);
    var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin     = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');



    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' && discardedids != undefined  && discardedids.length > 0 && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TVTA");
      
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getFreqCelda.getFreqCeldaBioVTA, {
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
    else if (hasBios === 'true' && apriori === 'apriori' && discardedids != undefined  && discardedids.length > 0 && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("BVTA");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getFreqCelda.getFreqCeldaBioVTA, {
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
    else if (hasRaster === 'true' && apriori === 'apriori' && discardedids != undefined  && discardedids.length > 0 && discardedids.length > 0 && discardedFilterids != undefined ){

      console.log("RaVTA");
      

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getFreqCelda.getFreqCeldaRaVTA, {
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
 * getFreqCelda_VA de SNIB DB, considerando validacion y apriori
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqCelda_VA = function (req, res, next) {


    console.log("getFreqCelda_VA");

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
    var apriori         = getParam(req, 'apriori');
    
    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' && discardedids != undefined  && discardedids.length > 0 ){

      console.log("TVA");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqCelda.getFreqCeldaVA, {
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
    else if (hasBios === 'true' && apriori === 'apriori' && discardedids != undefined && discardedids.length > 0 ){

      console.log("BVA");
      
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      

      pool.any(queries.getFreqCelda.getFreqCeldaBioVA, {
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
    else if (hasRaster === 'true' && apriori === 'apriori' && discardedids != undefined && discardedids.length > 0 ){

      console.log("RaVA");
      
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      
      pool.any(queries.getFreqCelda.getFreqCeldaRaVA, {
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
 * getFreqCelda_VT de SNIB DB, considerando validacion y tiempo
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqCelda_VT = function (req, res, next) {


    console.log("getFreqCelda_VT");

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
    var discardedFilterids = getParam(req, 'discardedFilterids');
    
    // filtros por tiempo
    var sfecha        = getParam(req, 'sfecha', false);
    var fecha_incio   = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin     = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');


    if (hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined ){

      console.log("TVT");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      

      pool.any(queries.getFreqCelda.getFreqCeldaVT, {
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
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


      pool.any(queries.getFreqCelda.getFreqCeldaBioVT, {
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
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      
      pool.any(queries.getFreqCelda.getFreqCeldaRaVT, {
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
 * getFreqCelda_TA de SNIB DB, mapa probabilidad
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqCelda_TA = function (req, res, next) {

    console.log("getFreqCelda_TA");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var apriori         = getParam(req, 'apriori');


    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');



    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

        console.log("TTA");

        var whereVar = "";
        
        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
        var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

        pool.any(queries.getFreqCelda.getFreqCeldaTA, {
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
    else if (hasBios === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

        console.log("BTA");

        var whereVar = "";

        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }

        var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


        pool.any(queries.getFreqCelda.getFreqCeldaBioTA, {
            
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
          console.log(error);
          next(error)
        })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("RaTA");
      
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

          pool.any(queries.getFreqCelda.getFreqCeldaRaTA, {
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
 * getFreqCelda_A de SNIB DB, apriori
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqCelda_A = function (req, res, next) {

    console.log("getFreqCelda_A");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var apriori         = getParam(req, 'apriori');

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

        console.log("TA");

        var whereVar = "";
        
        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

            pool.any(queries.getFreqCelda.getFreqCeldaA, {
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
    else if (hasBios === 'true' && apriori === 'apriori' ){

      console.log("BA");

      var whereVar = "";

      if(tfilters.length>0){
          whereVar = verb_utils.processBioFilters(tfilters, spid);
          whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
          whereVar = " epitetovalido <> '' ";
      }

          pool.any(queries.getFreqCelda.getFreqCeldaBioA, {
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
            console.log(error);
            next(error)
          })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' ){

      console.log("RaA");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

          pool.any(queries.getFreqCelda.getFreqCeldaRaA, {
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




/**
 *
 * getFreqCelda_V de SNIB DB, con validación
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqCelda_V = function (req, res, next) {

    console.log("getFreqCelda_V");

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
    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("TV");
      var whereVar = "";
      if(tfilters.length>0){
          whereVar = verb_utils.processBioFilters(tfilters, spid);
          whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
          whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqCelda.getFreqCeldaV, {
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

      pool.any(queries.getFreqCelda.getFreqCeldaBioV, {
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
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("RaV");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqCelda.getFreqCeldaRaV, {
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
 * getFreqCelda_T de SNIB DB, con tiempo
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqCelda_T = function (req, res, next) {

    console.log("getFreqCelda_T");

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
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');


    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TT");
      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


      pool.any(queries.getFreqCelda.getFreqCeldaT, {
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
    else if (hasBios === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("B");

      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      // var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      // console.log(whereVar);
      // console.log(filterDates);
      // console.log(discardedFilterids);


      pool.any(queries.getFreqCelda.getFreqCeldaBioT, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getFreqCelda.getFreqCeldaRaT, {
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
 * getFreqCelda de SNIB DB, sin filtros
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin utilzar filtros
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqCelda = function (req, res, next) {

    console.log("getFreqCelda");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqCelda.getFreqCelda, {
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
      // console.log(whereVar);

      pool.any(queries.getFreqCelda.getFreqCeldaBio, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreqCelda.getFreqCeldaRaster, {
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



/******************************************************************** getFreqMap */

/**
 *
 * getFreqMap_TM de SNIB DB, tiempo y mapa probabilidad
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqMap_TM = function (req, res, next) {

    console.log("getFreqMap_TM");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;
    var maxscore    = 700;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var mapa_prob         = getParam(req, 'mapa_prob');


    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');



    
    if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' && discardedFilterids != undefined && discardedFilterids.length > 0){

        console.log("TTM");

        var whereVar = "";
        
        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
        var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

        pool.any(queries.getFreqMap.getFreqMapTM, {
            spid: spid,
            N: N,
            alpha: alpha,
            min_occ: min_occ,
            maxscore: maxscore,
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
    else if (hasBios === 'true' && mapa_prob === 'mapa_prob' && discardedFilterids != undefined && discardedFilterids.length > 0){

        console.log("BTM");

        var whereVar = "";

        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }

        var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


        pool.any(queries.getFreqMap.getFreqMapBioTM, {
            
            spid: spid,
            N: N,
            alpha: alpha,
            maxscore: maxscore,
            min_occ: min_occ,
            where_config: whereVar,
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
    else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("RaTM");
      
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

          pool.any(queries.getFreqMap.getFreqMapRaTM, {
              spid: spid,
              N: N,
              alpha: alpha,
              maxscore: maxscore,
              min_occ: min_occ,
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
    else{

      next();
    }

};


/**
 *
 * getFreqMap_TA de SNIB DB, tiempo y apriori
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqMap_TA = function (req, res, next) {

    console.log("getFreqMap_TA");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var apriori         = getParam(req, 'apriori');


    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');



    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

        console.log("TTA");

        var whereVar = "";
        
        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
        var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

        pool.any(queries.getFreqMap.getFreqMapTA, {
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
    else if (hasBios === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

        console.log("BTA");

        var whereVar = "";

        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }

        var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


        pool.any(queries.getFreqMap.getFreqMapBioTA, {
            
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
          console.log(error);
          next(error)
        })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("RaTA");
      
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

          pool.any(queries.getFreqMap.getFreqMapRaTA, {
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
 * getFreqMap_M de SNIB DB, mapa de probabilidad
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqMap_M = function (req, res, next) {

    console.log("getFreqMap_M");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;
    var maxscore    = 700;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var mapa_prob       = getParam(req, 'mapa_prob');

    
    if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

        console.log("TM");

        var whereVar = "";
        
        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

            pool.any(queries.getFreqMap.getFreqMapM, {
                spid: spid,
                N: N,
                alpha: alpha,
                maxscore: maxscore,
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
    else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("BM");

      var whereVar = "";

      if(tfilters.length>0){
          whereVar = verb_utils.processBioFilters(tfilters, spid);
          whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
          whereVar = " epitetovalido <> '' ";
      }

      pool.any(queries.getFreqMap.getFreqMapBioM, {
          spid: spid,
          N: N,
          alpha: alpha,
          maxscore: maxscore,
          min_occ: min_occ,
          where_config: whereVar
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("RaM");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

          pool.any(queries.getFreqMap.getFreqMapRaM, {
              spid: spid,
              N: N,
              alpha: alpha,
              maxscore: maxscore,
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




/**
 *
 * getFreqMap_A de SNIB DB, apriori
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqMap_A = function (req, res, next) {

    console.log("getFreqMap_A");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var apriori         = getParam(req, 'apriori');

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

        console.log("TA");

        var whereVar = "";
        
        if(tfilters.length>0){
            whereVar = verb_utils.processBioFilters(tfilters, spid);
            whereVar = whereVar + " and epitetovalido <> '' ";
        }
        else{
            whereVar = " epitetovalido <> '' ";
        }
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

            pool.any(queries.getFreqMap.getFreqMapA, {
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
    else if (hasBios === 'true' && apriori === 'apriori' ){

      console.log("BA");

      var whereVar = "";

      if(tfilters.length>0){
          whereVar = verb_utils.processBioFilters(tfilters, spid);
          whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
          whereVar = " epitetovalido <> '' ";
      }

      pool.any(queries.getFreqMap.getFreqMapBioA, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' ){

      console.log("RaA");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

          pool.any(queries.getFreqMap.getFreqMapRaA, {
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




/**
 *
 * getFreqMap_T de SNIB DB, con tiempo
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqMap_T = function (req, res, next) {

    console.log("getFreqMap_T");

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
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');


    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TT");
      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


      pool.any(queries.getFreqMap.getFreqMapT, {
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
    else if (hasBios === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("B");
      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      
      pool.any(queries.getFreqMap.getFreqMapBioT, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getFreqMap.getFreqMapRaT, {
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
 * getFreqMap de SNIB DB, sin filtros
 *
 * Obtiene la suma de socre por celda para desplegar en el mapa
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqMap = function (req, res, next) {

    console.log("getFreqMap");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqMap.getFreqMap, {
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
      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      pool.any(queries.getFreqMap.getFreqMapBio, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreqMap.getFreqMapRaster, {
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


/******************************************************************** getScoreDecil */



/**
 *
 * getScoreDecil_VTA de SNIB DB, con validacion, tiempo y apriori
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecil_VTA = function (req, res, next) {

    console.log("getScoreDecil_VTA");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var apriori         = getParam(req, 'apriori');
    
    var groupid        = getParam(req, 'groupid');
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    var discardedids    = getParam(req, 'discardedids', []);

    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');



    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TVTA");

      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      
      pool.any(queries.getScoreDecil.getScoreDecilVTA, {
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

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && apriori === 'apriori' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("BVTA");
      var whereVar = "";
      
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      
      pool.any(queries.getScoreDecil.getScoreDecilBioVTA, {
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

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {

        console.log(error);
        next(error)

      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("RaVTA");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      

      pool.any(queries.getScoreDecil.getScoreDecilRaVTA, {
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

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
 * getScoreDecil_VT de SNIB DB, con validacion y tiempo
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecil_VT = function (req, res, next) {

    console.log("getScoreDecil_VT");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    
    var groupid        = getParam(req, 'groupid');
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    var discardedids    = getParam(req, 'discardedids', []);

    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');



    if (hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TVT");

      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      
      pool.any(queries.getScoreDecil.getScoreDecilVT, {
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

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("BVT");
      var whereVar = "";
      
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      
      pool.any(queries.getScoreDecil.getScoreDecilBioVT, {
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

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {

        console.log(error);
        next(error)

      })

      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("RaVT");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var discardedids_total = discardedFilterids.concat(discardedids); 
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      

      pool.any(queries.getScoreDecil.getScoreDecilRaVT, {
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

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
 * getScoreDecil_VA de SNIB DB, con validacion y apriori
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecil_VA = function (req, res, next) {

    console.log("getScoreDecil_VA");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    
    var groupid        = getParam(req, 'groupid');
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    var apriori         = getParam(req, 'apriori');
    var discardedids    = getParam(req, 'discardedids', []);


    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' && discardedids != undefined && discardedids.length > 0 ){

      console.log("TVA");
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      
      pool.any(queries.getScoreDecil.getScoreDecilVA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && apriori === 'apriori' && discardedids != undefined && discardedids.length > 0 ){

      console.log("BVA");
      var whereVar = "";
      
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      pool.any(queries.getScoreDecil.getScoreDecilBioVA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {

        console.log(error);
        next(error)

      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' && discardedids != undefined && discardedids.length > 0 ){

      console.log("RaVA");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getScoreDecil.getScoreDecilRaVA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
 * getScoreDecil_TA de SNIB DB, con tiempo y apriori
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecil_TA = function (req, res, next) {

    console.log("getScoreDecil_TA");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    
    var groupid        = getParam(req, 'groupid');
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    var apriori         = getParam(req, 'apriori');


    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TTA");
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getScoreDecil.getScoreDecilTA, {
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

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("BTA");
      var whereVar = "";
      
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);


      pool.any(queries.getScoreDecil.getScoreDecilBioTA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        filter_dates: filterDates,
        arg_gridids: discardedFilterids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {

        console.log(error);
        next(error)

      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("RaTA");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      

      pool.any(queries.getScoreDecil.getScoreDecilRaTA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        filter_dates: filterDates,
        arg_gridids: discardedFilterids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
 * getScoreDecil_A de SNIB DB, con validación
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecil_A = function (req, res, next) {

    console.log("getScoreDecil_A");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var apriori         = getParam(req, 'apriori');

    var groupid        = getParam(req, 'groupid');
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);


    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

      console.log("TA");
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getScoreDecil.getScoreDecilA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && apriori === 'apriori' ){

      console.log("BA");
      var whereVar = "";
      
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }


      pool.any(queries.getScoreDecil.getScoreDecilBioA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' ){

      console.log("RaA");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      

      pool.any(queries.getScoreDecil.getScoreDecilRaA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
 * getScoreDecil_V de SNIB DB, con validación
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecil_V = function (req, res, next) {

    console.log("getScoreDecil_V");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');


    var groupid        = getParam(req, 'groupid');
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    var discardedids    = getParam(req, 'discardedids', []);
    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("TV");
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getScoreDecil.getScoreDecilV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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


      pool.any(queries.getScoreDecil.getScoreDecilBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("RaV");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      

      pool.any(queries.getScoreDecil.getScoreDecilRaV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
 * getScoreDecil_T de SNIB DB, con tiempo
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecil_T = function (req, res, next) {

    console.log("getScoreDecil_T");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');


    var groupid        = getParam(req, 'groupid');
    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');

    // console.log(fecha_incio);
    // console.log(fecha_fin);

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("TT");
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getScoreDecil.getScoreDecilT, {
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

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("BT");
      var whereVar = "";
      
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getScoreDecil.getScoreDecilBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        filter_dates: filterDates,
        arg_gridids: discardedFilterids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("RaT");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getScoreDecil.getScoreDecilRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        filter_dates: filterDates,
        arg_gridids: discardedFilterids.toString()
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
 * getScoreDecil de SNIB DB, sin filtros
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecil = function (req, res, next) {

    console.log("getScoreDecil");


    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var groupid        = getParam(req, 'groupid');

    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getScoreDecil.getScoreDecil, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
      // console.log(whereVar);

      pool.any(queries.getScoreDecil.getScoreDecilBio, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getScoreDecil.getScoreDecilRaster, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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

/******************************************************************** getGridSpecies */





/**
 *
 * getGridSpecies_TM de SNIB DB, mapa prob con tiempo
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpecies_TM = function (req, res, next) {

    console.log("getGridSpecies_TM");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');
    var idGrid      = getParam(req, 'idGrid');

    var mapa_prob       = getParam(req, 'mapa_prob');

    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');

    
    if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("T");

      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getUtilGeoportal.getGridSpeciesTM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        idGrid: idGrid,
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
    else if (hasBios === 'true' && mapa_prob === 'mapa_prob' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("B");

      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      
      pool.any(queries.getUtilGeoportal.getGridSpeciesBioTM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        idGrid: idGrid,
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
    else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("Ra");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getUtilGeoportal.getGridSpeciesRaTM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        idGrid: idGrid,
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
    else{

      next();
    }

};


/**
 *
 * getGridSpecies_TA de SNIB DB, con tiempo
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpecies_TA = function (req, res, next) {

    console.log("getGridSpecies_TA");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');
    var idGrid      = getParam(req, 'idGrid');

    var apriori     = getParam(req, 'apriori');

    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("T");

      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getUtilGeoportal.getGridSpeciesTA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        idGrid: idGrid,
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
    else if (hasBios === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("B");

      var whereVar = "";
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      
      pool.any(queries.getUtilGeoportal.getGridSpeciesBioTA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        idGrid: idGrid,
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
    else if (hasRaster === 'true' && apriori === 'apriori' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("Ra");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var filterDates = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);

      pool.any(queries.getUtilGeoportal.getGridSpeciesRaTA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        idGrid: idGrid,
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
    else{

      next();
    }

};





/**
 *
 * getGridSpecies_M de SNIB DB, con mapa prob
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpecies_M = function (req, res, next) {

    console.log("getGridSpecies_M");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');
    var idGrid      = getParam(req, 'idGrid');

    var mapa_prob       = getParam(req, 'mapa_prob');

    
    if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("T");

      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      
      pool.any(queries.getUtilGeoportal.getGridSpeciesM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        idGrid: idGrid
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("B");

      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      
      pool.any(queries.getUtilGeoportal.getGridSpeciesBioM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        idGrid: idGrid
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getUtilGeoportal.getGridSpeciesRaM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        idGrid: idGrid
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
 * getGridSpecies_A de SNIB DB, con tiempo
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpecies_A = function (req, res, next) {

    console.log("getGridSpecies_A");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');
    var idGrid      = getParam(req, 'idGrid');

    var apriori         = getParam(req, 'apriori');

    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

      console.log("T");

      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      
      pool.any(queries.getUtilGeoportal.getGridSpeciesA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        idGrid: idGrid
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && apriori === 'apriori' ){

      console.log("B");

      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }

      
      pool.any(queries.getUtilGeoportal.getGridSpeciesBioA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        idGrid: idGrid
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' ){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getUtilGeoportal.getGridSpeciesRaA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        idGrid: idGrid
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
 * getGridSpecies_T de SNIB DB, con tiempo
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpecies_T = function (req, res, next) {

    console.log("getGridSpecies_T");


    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');
    var idGrid      = getParam(req, 'idGrid');

    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedFilterids');

    var query;
    var data = {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ
    }


    if (hasBios === "true" && hasRaster === "true" && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("T");  

      data["where_config"]        = verb_utils.processBioFilters(tfilters, spid);
      data["where_config_raster"] = verb_utils.processRasterFilters(tfilters, spid);
      data["filter_dates"]        = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      data["arg_gridids"]         = discardedFilterids.toString();
      query = queries.getUtilGeoportal.getGridSpeciesT;
      

    }
    else if (hasBios === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("B");

      console.log(verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha));
      
      data["where_config"]        = verb_utils.processBioFilters(tfilters, spid);
      data["filter_dates"]        = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      data["arg_gridids"]         = discardedFilterids.toString();
      query = queries.getUtilGeoportal.getGridSpeciesT;
      
      
    } 
    else if (hasRaster === 'true' && discardedFilterids != undefined && discardedFilterids.length > 0){

      console.log("Ra");

      data["where_config_raster"] = verb_utils.processRasterFilters(tfilters, spid);
      data["filter_dates"]        = verb_utils.processDateRecords(fecha_incio, fecha_fin, sfecha);
      data["arg_gridids"]         = discardedFilterids.toString();
      query = queries.getUtilGeoportal.getGridSpeciesRaT;
      
    } 
    else{

      next();
    }

    pool.any(query, data)
    .then(function (data) {
      console.log(data);
      res.json({'data': data})
    })
    .catch(function (error) {
      console.log(error);
      next(error)
    })

};





/**
 *
 * getGridSpecies de SNIB DB
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpecies = function (req, res, next) {

    console.log("getGridSpecies");


    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 6473;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');

    var idGrid      = getParam(req, 'idGrid');

    // console.log(idGrid);
    // var groupid        = getParam(req, 'groupid');
    // var title_valor = verb_utils.processTitleGroup(groupid, tfilters);
    
    if (hasBios === 'true' && hasRaster === 'true'){

      console.log("T");
      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getUtilGeoportal.getGridSpecies, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        idGrid: idGrid
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

      if(tfilters.length>0){
        whereVar = verb_utils.processBioFilters(tfilters, spid);
        whereVar = whereVar + " and epitetovalido <> '' ";
      }
      else{
        whereVar = " epitetovalido <> '' ";
      }
      // var whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);

      pool.any(queries.getUtilGeoportal.getGridSpeciesBio, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        idGrid: idGrid
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getUtilGeoportal.getGridSpeciesRaster, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        idGrid: idGrid
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

    console.log("getGeoRelNiche_VT");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var discardedids    = getParam(req, 'discardedids', []);
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedDateFilterids');
    // console.log(discardedFilterids);


    

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("V");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getGeoRelNiche.getGeoRelVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString(),
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

        var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
        console.log(caso);


        console.log("B");
        var whereVar = verb_utils.processBioFilters(tfilters, spid);
        // console.log(whereVar);

        pool.any(queries.getGeoRelNiche.getGeoRelBioVT, {
          spid: spid,
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config: whereVar,
          arg_gridids: discardedids.toString(),
          lim_inf: fecha_incio.format("YYYY"),
          lim_sup: fecha_fin.format("YYYY"),
          caso: caso
        })
        .then(function (data) {
          // console.log(data.length);
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getGeoRelNiche.getGeoRelRaVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString(),
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
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
 * Servidor Niche: getGeoRelNiche_V de SNIB DB, con validación
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRelNiche_V = function (req, res, next) {

    console.log("getGeoRelNiche_V");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var discardedids    = getParam(req, 'discardedids', []);

    // console.log(discardedids);

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("V");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getGeoRelNiche.getGeoRelV, {
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

      console.log("B");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);

      pool.any(queries.getGeoRelNiche.getGeoRelBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        // console.log(data.length);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getGeoRelNiche.getGeoRelRaV, {
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
 * Servidor Niche: getGeoRelNiche_T de SNIB DB, con tiempo
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRelNiche_T = function (req, res, next) {

    console.log("getGeoRelNiche_T");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedDateFilterids');

    console.log(discardedFilterids);

    
    

    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid);
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getGeoRelNiche.getGeoRelT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

     
      

    }
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      console.log("B");

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);
      
      pool.any(queries.getGeoRelNiche.getGeoRelBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      

      
    } 
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("Ra");

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getGeoRelNiche.getGeoRelRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
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
 * Servidor Niche: getGeoRelNiche de SNIB DB, sin filtros
 *
 * Obtiene epsilon y score de la relación de especie objetivo y conjunto de variables bioticas y raster.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGeoRelNiche = function (req, res, next) {

    console.log("getGeoRelNiche");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    // console.log(hasBios);
    // console.log(hasRaster);
    // console.log(spid);
    // console.log(tfilters);
    // console.log(min_occ);
    
    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getGeoRelNiche.getGeoRel, {
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
      // console.log(whereVar);
      // console.log(queries.getGeoRelNiche.getGeoRelBio);

      pool.any(queries.getGeoRelNiche.getGeoRelBio, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getGeoRelNiche.getGeoRelRaster, {
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

      console.log("NESTTTT");

      next();
    }




};





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

    console.log("getFreqNiche_VT");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var discardedids    = getParam(req, 'discardedids', []);
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedDateFilterids');
    // console.log(discardedFilterids);

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("V");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqNiche.getFreqVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString(),
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

        var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
        console.log(caso);


        console.log("B");
        var whereVar = verb_utils.processBioFilters(tfilters, spid);
        // console.log(whereVar);

        pool.any(queries.getFreqNiche.getFreqBioVT, {
          spid: spid,
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config: whereVar,
          arg_gridids: discardedids.toString(),
          lim_inf: fecha_incio.format("YYYY"),
          lim_sup: fecha_fin.format("YYYY"),
          caso: caso
        })
        .then(function (data) {
          // console.log(data.length);
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreqNiche.getFreqRaVT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString(),
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
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
 * Servidor Niche: getFreqNiche_V de SNIB DB, con validación
 *
 * Obtiene frecuencia de epsilon y score por especie
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqNiche_V = function (req, res, next) {

    console.log("getFreqNiche_V");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var discardedids    = getParam(req, 'discardedids', []);

    // console.log(discardedids);

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("V");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqNiche.getFreqV, {
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

      console.log("B");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);

      pool.any(queries.getFreqNiche.getFreqBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        // console.log(data.length);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreqNiche.getFreqRasterV, {
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
 * Servidor Niche: getFreqNiche_T de SNIB DB, con tiempo
 *
 * Obtiene frecuencia de epsilon y score por especie
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqNiche_T = function (req, res, next) {

    console.log("getFreqNiche_T");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedDateFilterids');

    console.log(discardedFilterids);

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid);
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getFreqNiche.getFreqT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

     
      

    }
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      console.log("B");

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);
      
      pool.any(queries.getFreqNiche.getFreqBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      

      
    } 
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("Ra");

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getFreqNiche.getFreqRasterT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
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
 * getFreqNiche de SNIB DB, sin filtros
 *
 * Obtiene frecuencia de epsilon y score por especie
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqNiche = function (req, res, next) {

    console.log("getFreqNiche");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqNiche.getFreq, {
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

      pool.any(queries.getFreqNiche.getFreqBio, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreqNiche.getFreqRaster, {
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

    console.log("getFreqMapNiche_M");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707;
    var maxscore    = 700;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var mapa_prob       = getParam(req, 'mapa_prob');

    
    if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

        console.log("TM");

        var whereVar = verb_utils.processBioFilters(tfilters, spid);
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

            pool.any(queries.getFreqMapNiche.getFreqMapM, {
                spid: spid,
                N: N,
                alpha: alpha,
                maxscore: maxscore,
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
    else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("BM");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);

      pool.any(queries.getFreqMapNiche.getFreqMapBioM, {
          spid: spid,
          N: N,
          alpha: alpha,
          maxscore: maxscore,
          min_occ: min_occ,
          where_config: whereVar
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("RaM");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

          pool.any(queries.getFreqMapNiche.getFreqMapRaM, {
              spid: spid,
              N: N,
              alpha: alpha,
              maxscore: maxscore,
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

    console.log("getFreqMapNiche_A");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var apriori         = getParam(req, 'apriori');

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

        console.log("TA");

        var whereVar = verb_utils.processBioFilters(tfilters, spid);
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

            pool.any(queries.getFreqMapNiche.getFreqMapA, {
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
    else if (hasBios === 'true' && apriori === 'apriori' ){

      console.log("BA");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);

      pool.any(queries.getFreqMapNiche.getFreqMapBioA, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' ){

      console.log("RaA");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

          pool.any(queries.getFreqMapNiche.getFreqMapRaA, {
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

    console.log("getFreqMapNiche_T");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedDateFilterids');

    // console.log(discardedFilterids);

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      // console.log(caso);


      console.log("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid);
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getFreqMapNiche.getFreqMapT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

     
      

    }
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      console.log("B");

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      // console.log(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);
      
      pool.any(queries.getFreqMapNiche.getFreqMapBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      // console.log(caso);


      console.log("Ra");

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getFreqMapNiche.getFreqMapRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
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
 * getFreqMapNiche de SNIB DB, sin filtros
 *
 * Obtiene frecuencia score por celda para desplegar el mapa de probabilidad
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqMapNiche = function (req, res, next) {

    console.log("getFreqMapNiche");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqMapNiche.getFreqMap, {
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

      pool.any(queries.getFreqMapNiche.getFreqMapBio, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreqMapNiche.getFreqMapRaster, {
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

    console.log("getFreqCeldaNiche_A");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var apriori         = getParam(req, 'apriori');

    
    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

        console.log("TA");

        var whereVar = verb_utils.processBioFilters(tfilters, spid);
        var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

            pool.any(queries.getFreqCeldaNiche.getFreqCeldaA, {
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
    else if (hasBios === 'true' && apriori === 'apriori' ){

      console.log("BA");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioA, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' ){

      console.log("RaA");

      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

          pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaA, {
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

    console.log("getFreqCeldaNiche_V");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var discardedids    = getParam(req, 'discardedids', []);

    // console.log(discardedids);

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("V");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaV, {
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

      console.log("B");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        // console.log(data.length);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaV, {
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
 * Servidor Niche: getFreqCeldaNiche_T de SNIB DB, con tiempo
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin utilzar filtros
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getFreqCeldaNiche_T = function (req, res, next) {

    console.log("getFreqCeldaNiche_T");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedDateFilterids');

    console.log(discardedFilterids);

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid);
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getFreqCeldaNiche.getFreqCeldaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

     
      

    }
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      console.log("B");

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);
      
      pool.any(queries.getFreqCeldaNiche.getFreqCeldaBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      

      
    } 
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("Ra");

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        // console.log(data);
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
 * getFreqCeldaNiche de SNIB DB, sin filtros
 *
 * Obtiene la frecuencia del score por celda obtenido de las especies, sin utilzar filtros
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getFreqCeldaNiche = function (req, res, next) {

    console.log("getFreqCeldaNiche");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getFreqCeldaNiche.getFreqCelda, {
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
      // console.log(whereVar);

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaBio, {
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
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getFreqCeldaNiche.getFreqCeldaRaster, {
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




/******************************************************************** getScoreDecilNiche */



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

    console.log("getScoreDecilNiche_V");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);
    var groupid        = getParam(req, 'groupid');

    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var discardedids    = getParam(req, 'discardedids', []);

    // console.log(discardedids);

    
    if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("V");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getScoreDecilNiche.getScoreDecilV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("B");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);

      pool.any(queries.getScoreDecilNiche.getScoreDecilBioV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }
        // console.log(data.length);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getScoreDecilNiche.getScoreDecilRaV, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        arg_gridids: discardedids.toString()
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }
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
 * getScoreDecilNiche_T de SNIB DB, sin filtros
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecilNiche_T = function (req, res, next) {

    console.log("getScoreDecilNiche_T");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var groupid        = getParam(req, 'groupid');

    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedDateFilterids');

    console.log(discardedFilterids);

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("T");  

       whereVar = verb_utils.processBioFilters(tfilters, spid);
       whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getScoreDecilNiche.getScoreDecilT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

     
      

    }
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      console.log("B");

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);  

      whereVar = verb_utils.processBioFilters(tfilters, spid);
      // console.log(whereVar);
      
      pool.any(queries.getScoreDecilNiche.getScoreDecilBioT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      

      
    } 
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      console.log(caso);


      console.log("Ra");

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
      pool.any(queries.getScoreDecilNiche.getScoreDecilRaT, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        lim_inf: fecha_incio.format("YYYY"),
        lim_sup: fecha_fin.format("YYYY"),
        caso: caso
      })
      .then(function (data) {
        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }
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
 * getScoreDecilNiche de SNIB DB, sin filtros
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getScoreDecilNiche = function (req, res, next) {

    console.log("getScoreDecilNiche");


    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');
    var groupid        = getParam(req, 'groupid');

    var title_valor = verb_utils.processTitleGroup(groupid, tfilters);

    
    if (hasBios === 'true' && hasRaster === 'true' ){

      console.log("T");
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

      pool.any(queries.getScoreDecilNiche.getScoreDecil, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        where_config_raster: whereVarRaster
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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
      // console.log(whereVar);

      pool.any(queries.getScoreDecilNiche.getScoreDecilBio, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      // console.log(whereVarRaster);

      pool.any(queries.getScoreDecilNiche.getScoreDecilRaster, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster
      })
      .then(function (data) {

        for(i = 0; i < data.length; i++){
          item = data[i];
          item["title"] = title_valor;
        }

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

    console.log("getGridSpeciesNiche_M");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707;
    var maxscore    = 700;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');
    var lat         = getParam(req, 'lat');
    var long        = getParam(req, 'long');

    var mapa_prob       = getParam(req, 'mapa_prob');

    
    if (hasBios === 'true' && hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("T");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);
      
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
        maxscore: maxscore
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("B");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);

      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && mapa_prob === 'mapa_prob' ){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);

      pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaM, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore
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
 * getGridSpeciesNiche_A de SNIB DB, apriori
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpeciesNiche_A = function (req, res, next) {

    console.log("getGridSpeciesNiche_A");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707;
    var maxscore    = 700;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');
    var lat         = getParam(req, 'lat');
    var long        = getParam(req, 'long');
    var apriori     = getParam(req, 'apriori');

    if (hasBios === 'true' && hasRaster === 'true' && apriori === 'apriori' ){

      console.log("T");

      var whereVar  = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);
      
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
        maxscore: maxscore
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    }
    else if (hasBios === 'true' && apriori === 'apriori' ){

      console.log("B");

      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);

      pool.any(queries.getGridSpeciesNiche.getGridSpeciesBioA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true' && apriori === 'apriori' ){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);

      pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaA, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore
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
 * getGridSpeciesNiche_T de SNIB DB
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

exports.getGridSpeciesNiche_T = function (req, res, next) {

    console.log("getGridSpeciesNiche_T");

    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707; // Verificar N, que se esta contemplando
    var maxscore    = 700;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios         = getParam(req, 'hasBios');
    var hasRaster       = getParam(req, 'hasRaster');

    var lat      = getParam(req, 'lat');
    var long      = getParam(req, 'long');
    
    // filtros por tiempo
    var sfecha            = getParam(req, 'sfecha', false);
    var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
    var discardedFilterids = getParam(req, 'discardedDateFilterids');

    // console.log(discardedFilterids);

    
    if (hasBios === "true" && hasRaster === "true" && discardedFilterids === "true"){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      // console.log(caso);


      console.log("T");  

       var whereVar = verb_utils.processBioFilters(tfilters, spid);
       var whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
       var categorias = verb_utils.getRasterCategories(tfilters);
      
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
        maxscore: maxscore
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

    }
    else if (hasBios === 'true' && discardedFilterids === "true" ){

      console.log("B");

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);
      
      
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
        maxscore: maxscore
      })
      .then(function (data) {
        // console.log(data);
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })
      
    } 
    else if (hasRaster === 'true' && discardedFilterids === "true" ){

      var caso = verb_utils.getTimeCase(fecha_incio, fecha_fin, sfecha);
      var categorias = verb_utils.getRasterCategories(tfilters);


      console.log("Ra");

      whereVarRaster = verb_utils.processRasterFilters(tfilters,spid);
      
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
        maxscore: maxscore
      })
      .then(function (data) {
        // console.log(data);
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
 * getGridSpeciesNiche de SNIB DB
 *
 * Obtiene el score por celda agrupado por decil
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */

 exports.getGridSpeciesNiche = function (req, res, next) {

    console.log("getGridSpeciesNiche");

    
    var spid        = getParam(req, 'id');
    var tfilters    = getParam(req, 'tfilters');
    var alpha       = 0.01;
    var N           = 14707;
    var maxscore    = 700;

    // Siempre incluidos en query, nj >= 0
    var min_occ       = getParam(req, 'min_occ', 0);

    // variables configurables
    var hasBios     = getParam(req, 'hasBios');
    var hasRaster   = getParam(req, 'hasRaster');

    var lat      = getParam(req, 'lat');
    var long      = getParam(req, 'long');

    // console.log(idGrid);
    // var groupid        = getParam(req, 'groupid');
    // var title_valor = verb_utils.processTitleGroup(groupid, tfilters);
    
    if (hasBios === 'true' && hasRaster === 'true'){

      console.log("T");
      
      var whereVar = verb_utils.processBioFilters(tfilters, spid);
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);

      console.log(categorias);

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
        maxscore: maxscore
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
      var categorias = verb_utils.getRasterCategories(tfilters);
      
      pool.any(queries.getGridSpeciesNiche.getGridSpeciesBio, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config: whereVar,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore
      })
      .then(function (data) {
        res.json({'data': data})
      })
      .catch(function (error) {
        console.log(error);
        next(error)
      })

      
    } 
    else if (hasRaster === 'true'){

      console.log("Ra");
      var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);
      var categorias = verb_utils.getRasterCategories(tfilters);
      // console.log(whereVarRaster);

      pool.any(queries.getGridSpeciesNiche.getGridSpeciesRaster, {
        spid: spid,
        N: N,
        alpha: alpha,
        min_occ: min_occ,
        where_config_raster: whereVarRaster,
        long: long,
        lat: lat,
        categorias: categorias,
        maxscore: maxscore
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

  
      console.log("getEdgesNiche");

      // var spids = getParam(req, 'spids');
      var sfilters    = getParam(req, 's_tfilters');
      var tfilters    = getParam(req, 't_tfilters');
      var alpha       = 0.01;
      var N           = 14707;
      var min_occ       = getParam(req, 'min_occ', 0);


      var min_ep = 0.0;
      var max_edges = 1000;

      var hasBiosSource    = getParam(req, 'hasbiosource');
      var hasRasterSource    = getParam(req, 'hasrastersource');
      var hasBiosTarget    = getParam(req, 'hasbiotarget');
      var hasRasterTarget    = getParam(req, 'hasrastertarget');



    if ( hasBiosSource === true && hasBiosTarget === true && hasRasterSource === true && hasRasterTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);

        pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterSource === true && hasBiosTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterSource === true && hasRasterTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        // var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        
        pool.any(queries.getEdgesNiche.getEdgesNicheBioRaster_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasBiosTarget === true && hasRasterTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);



        pool.any(queries.getEdgesNiche.getEdgesNicheBio_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasBiosTarget === true && hasRasterTarget === true ){

        console.log("T");
        // var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);



        pool.any(queries.getEdgesNiche.getEdgesNicheRaster_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasBiosTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        pool.any(queries.getEdgesNiche.getEdgesNicheBio_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);
        // var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        
        pool.any(queries.getEdgesNiche.getEdgesNicheBio_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasBiosTarget === true ){

        console.log("T");
        // var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);

        pool.any(queries.getEdgesNiche.getEdgesNicheRaster_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasRasterTarget === true ){

        console.log("T");
        // var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        // var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        pool.any(queries.getEdgesNiche.getEdgesNicheRaster_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
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
 * Servidor Niche: getNodesNiche
 *
 *
 * @param {express.Request} req
 * @param {express.Response} res
 *
 */


exports.getNodesNiche = function (req, res, next) {

  
      console.log("getNodesNiche");

      
      var sfilters    = getParam(req, 's_tfilters');
      // console.log(sfilters);
      var tfilters    = getParam(req, 't_tfilters');
      // console.log(tfilters);
      var min_occ     = getParam(req, 'min_occ', 0);


      var alpha       = 0.01;
      var N           = 14707;
      var min_ep      = 0.0;
      var max_edges   = 1000;


      var hasBiosSource    = getParam(req, 'hasbiosource');
      var hasRasterSource    = getParam(req, 'hasrastersource');
      var hasBiosTarget    = getParam(req, 'hasbiotarget');
      var hasRasterTarget    = getParam(req, 'hasrastertarget');

      // console.log(hasBiosSource);
      // console.log(hasRasterSource);
      // console.log(hasBiosTarget);
      // console.log(hasRasterTarget);

      // console.log("validaciones");
      // console.log(hasBiosSource === true);
      // console.log(hasBiosTarget === true);
      // console.log(hasRasterSource === true);
      // console.log(hasRasterTarget === true);


    if ( hasBiosSource === true && hasBiosTarget === true && hasRasterSource === true && hasRasterTarget === true ){

        console.log("hasBiosSource - hasBiosTarget - hasRasterSource - hasRasterTarget");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        pool.any(queries.getNodesNiche.getNodesNicheBioRaster_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterSource === true && hasBiosTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        pool.any(queries.getNodesNiche.getNodesNicheBioRaster_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterSource === true && hasRasterTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        // var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        pool.any(queries.getNodesNiche.getNodesNicheBioRaster_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasBiosTarget === true && hasRasterTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        pool.any(queries.getNodesNiche.getNodesNicheBio_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasBiosTarget === true && hasRasterTarget === true ){

        console.log("T");
        // var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);

        pool.any(queries.getNodesNiche.getNodesNicheRaster_BioRaster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasBiosTarget === true ){

        console.log("hasBiosSource - hasBiosTarget");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);


        console.log(whereVarSource);
        console.log(whereVarTarget);


        pool.any(queries.getNodesNiche.getNodesNicheBio_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasBiosSource === true && hasRasterTarget === true ){

        console.log("T");
        var whereVarSource = verb_utils.processBioFilters(sfilters);
        // var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);
        // var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);

        pool.any(queries.getNodesNiche.getNodesNicheBio_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          where_config_source: whereVarSource,
          // where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasBiosTarget === true ){

        console.log("T");
        // var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        var whereVarTarget = verb_utils.processBioFilters(tfilters);
        // var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);

        pool.any(queries.getNodesNiche.getNodesNicheRaster_Bio, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          where_config_target: whereVarTarget
          // where_config_target_raster: whereVarTargetRaster
        })
        .then(function (data) {
          res.json({'data': data})
        })
        .catch(function (error) {
          console.log(error);
          next(error)
        })

      
    }
    else if ( hasRasterSource === true && hasRasterTarget === true ){

        console.log("T");
        // var whereVarSource = verb_utils.processBioFilters(sfilters);
        var whereVarSourceRaster = verb_utils.processRasterFilters(sfilters);

        // var whereVarTarget = verb_utils.processBioFilters(tfilters);
        var whereVarTargetRaster = verb_utils.processRasterFilters(tfilters);

        pool.any(queries.getNodesNiche.getNodesNicheRaster_Raster, {
          N: N,
          alpha: alpha,
          min_occ: min_occ,
          // where_config_source: whereVarSource,
          where_config_source_raster: whereVarSourceRaster,
          // where_config_target: whereVarTarget,
          where_config_target_raster: whereVarTargetRaster
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



/******************************************************************** UTILS Niche */



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

      console.log(getParam(req, 'qtype'));
      console.log("getCountGridid");

      var spids = getParam(req, 'spids');

      // console.log(spids);

      pool.any(queries.getCountGridid.getCount, {
        spids: spids.toString()
      })
          .then(function (data) {
            // console.log(data);
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

      console.log(getParam(req, 'qtype'));
      console.log("getGrididsNiche");

      pool.any(queries.getGrididsNiche.getGridids, {})
          .then(function (data) {
            // console.log(data);
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

      console.log(getParam(req, 'qtype'));
      console.log("getSpeciesNiche");

      var spid              = getParam(req, 'id');
      var sfecha            = getParam(req, 'sfecha', false);
      var fecha_incio       = moment(getParam(req, 'lim_inf', '1500'), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');
      var fecha_fin         = moment(getParam(req, 'lim_sup', moment().format('YYYY-MM-DD') ), ['YYYY-MM-DD', 'YYYY-MM', 'YYYY'], 'es');

      // console.log(spid);
      // console.log(sfecha);
      // console.log(fecha_incio.format('YYYY'));
      // console.log(fecha_fin.format('YYYY'));
      // console.log(moment().format('YYYY-MM-DD'));


      if( (parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ) && sfecha === "false"){
        console.log("rango y sin fecha");
        pool.any(queries.getSpeciesNiche.getSpeciesSDR, {
                spid: spid,
                lim_inf: fecha_incio.format('YYYY'),
                lim_sup: fecha_fin.format('YYYY')
          })
          .then(function (data) {
                // console.log(data);
                res.json({'data': data})
          })
          .catch(function (error) {
                console.log(error);
                next(error)
          })
      }
      else if( parseInt(fecha_incio.format('YYYY')) == 1500 && parseInt(fecha_fin.format('YYYY')) == parseInt(moment().format('YYYY'))  && sfecha === "false"){
          console.log("solo sin fecha");
          pool.any(queries.getSpeciesNiche.getSpeciesSD, {
                spid: spid
          })
          .then(function (data) {
                // console.log(data);
                res.json({'data': data})
          })
          .catch(function (error) {
                console.log(error);
                next(error)
          })
      }
      else if( parseInt(fecha_incio.format('YYYY')) != 1500 || parseInt(fecha_fin.format('YYYY')) != parseInt(moment().format('YYYY')) ){
          console.log("solo rango");
          pool.any(queries.getSpeciesNiche.getSpeciesR, {
                spid: spid,
                lim_inf: fecha_incio.format('YYYY'),
                lim_sup: fecha_fin.format('YYYY')
          })
          .then(function (data) {
                // console.log(data);
                res.json({'data': data})
          })
          .catch(function (error) {
                console.log(error);
                next(error)
          })
      }
      else{
          console.log("sin filtros");
          pool.any(queries.getSpeciesNiche.getSpecies, {
                spid: spid
          })
          .then(function (data) {
                // console.log(data);
                res.json({'data': data})
          })
          .catch(function (error) {
                console.log(error);
                next(error)
          })
      }
      

  }
  else{

    next();

  }
      
};



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

      console.log(getParam(req, 'qtype'));
      console.log("getEntListNiche");

      var str     = getParam(req, 'searchStr');
      var source  = parseInt(getParam(req, 'source'));
      var nivel  = getParam(req, 'nivel');
      var limit   = 15; // numero de resultados a desplegar
       var columnas = verb_utils.getColumns(source, nivel);

      console.log(nivel);
      console.log(str);
      console.log(columnas);

      pool.any(queries.getEntListNiche.getEntList, {
            str: str,
            columnas: columnas,
            nivel: nivel
      })
          .then(function (data) {
            // console.log(data);
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

//     console.log("getFreqMap_V");

//     var spid        = getParam(req, 'id');
//     var tfilters    = getParam(req, 'tfilters');
//     var alpha       = 0.01;
//     var N           = 6473;

//     // Siempre incluidos en query, nj >= 0
//     var min_occ       = getParam(req, 'min_occ', 0);

//     // variables configurables
//     var hasBios         = getParam(req, 'hasBios');
//     var hasRaster       = getParam(req, 'hasRaster');
//     var discardedids    = getParam(req, 'discardedids', []);
    
//     if ( hasBios === 'true' && hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

//       console.log("TV");
//       var whereVar = "";
//       if(tfilters.length>0){
//           whereVar = verb_utils.processBioFilters(tfilters, spid);
//           whereVar = whereVar + " and epitetovalido <> '' ";
//       }
//       else{
//           whereVar = " epitetovalido <> '' ";
//       }
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // pool.any(queries.getFreqCelda.getFreqCeldaV, {
//       //     spid: spid,
//       //     N: N,
//       //     alpha: alpha,
//       //     min_occ: min_occ,
//       //     where_config: whereVar,
//       //     where_config_raster: whereVarRaster,
//       //     arg_gridids: discardedids.toString()
//       // })
//       // .then(function (data) {
//       //     res.json({'data': data})
//       // })
//       // .catch(function (error) {
//       //     console.log(error);
//       //     next(error)
//       // })

      
//     }
//     else if (hasBios === 'true' && discardedids != undefined && discardedids.length > 0 ){

//       console.log("BV");

//       var whereVar = "";
//       if(tfilters.length > 0){
//           whereVar = verb_utils.processBioFilters(tfilters, spid);
//           whereVar = whereVar + " and epitetovalido <> '' ";
//       }
//       else{
//           whereVar = " epitetovalido <> '' ";
//       }

//       pool.any(queries.getFreqMap.getFreqMapBioV, {
//           spid: spid,
//           N: N,
//           alpha: alpha,
//           min_occ: min_occ,
//           where_config: whereVar,
//           arg_gridids: discardedids.toString()
//       })
//       .then(function (data) {
//         res.json({'data': data})
//       })
//       .catch(function (error) {
//         console.log(error);
//         next(error)
//       })

      
//     } 
//     else if (hasRaster === 'true' && discardedids != undefined && discardedids.length > 0 ){

//       console.log("RaV");
//       var whereVarRaster = verb_utils.processRasterFilters(tfilters, spid);

//       // pool.any(queries.getFreqCelda.getFreqCeldaRaV, {
//       //     spid: spid,
//       //     N: N,
//       //     alpha: alpha,
//       //     min_occ: min_occ,
//       //     where_config_raster: whereVarRaster,
//       //     arg_gridids: discardedids.toString()
//       // })
//       // .then(function (data) {
//       //     res.json({'data': data})
//       // })
//       // .catch(function (error) {
//       //     console.log(error);
//       //     next(error)
//       // })
      
//     } 
//     else{

//       next();
//     }

// };*/












