/** Express router que proveé rutas útiles
 * @module routes/utilsrouter
 * @requires express
 */


/**
 * Express router que monta las funciones asociadas útilidades.
 * @type {object}
 * @const
 * @namespace utilsRouter
 */
var router = require('express').Router()
// var verbsCtrl = require('../controllers/verbs')
var verbsCtrl = require('../controllers/verbsniche')

/**
 * Ruta con diversas funciones útiles para el frontend
 * @name get/especie
 * @function
 * @memberof module:routes/utilsrouter~utilsRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */


router.route('/especie/getUserReg')
  .get(verbsCtrl.getUserReg)
  .post(verbsCtrl.getUserReg)

router.route('/especie/getUserToken')
  .get(verbsCtrl.getUserToken)
  .post(verbsCtrl.getUserToken)

router.route('/especie/setUserReg')
  .post(verbsCtrl.setUserReg)

/**
 * @api {post} /niche/especie/getEntList
 * @apiName getEntList
 * @apiGroup Especie
 *
 * @apiParams {Boolean} limit Results should be limited
 * @apiParams {String} searchStr Specie query string
 * @apiParams {number=8,16,32,64} grid_res Grid resolution
 * @apiParams {number=1} source Source identification
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *      "limit": "true",
 *      "searchStr": "lynx",
 *      "source": 1,
 *      "grid_res": 16
 *    }
 *
 * @apiSuccess {Object[]} Data object with the matching species information
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "data": [
 *        {
 *          "spid": 82081,
 *          "reinovalido": "Animalia",
 *          "phylumdivisionvalido": "Chordata",
 *          "clasevalida": "Mammalia",
 *          "ordenvalido": "Carnivora",
 *          "familiavalida": "Felidae",
 *          "generovalido": "Lynx",
 *          "especievalidabusqueda": "Lynx canadensis",
 *          "occ": 27
 *        },
 *        {
 *          "spid": 83206,
 *          "reinovalido": "Animalia",
 *          "phylumdivisionvalido": "Chordata",
 *          "clasevalida": "Mammalia",
 *          "ordenvalido": "Carnivora",
 *          "familiavalida": "Felidae",
 *          "generovalido": "Lynx",
 *          "especievalidabusqueda": "Lynx proterolyncis",
 *          "occ": 2
 *        }
 *      ]
 *    }
 */
router.route('/especie/getEntList')
  .get(verbsCtrl.getEntListNiche)
  .post(verbsCtrl.getEntListNiche)

router.route('/especie/getToken')
  .get(verbsCtrl.getToken)
  .post(verbsCtrl.getToken)

router.route('/especie/getValuesFromToken')
  .get(verbsCtrl.getValuesFromToken)
  .post(verbsCtrl.getValuesFromToken)

/**
 * @api {post} /niche/especie/getGridGeoJson
 * @apiName getGridGeoJson
 * @apiGroup Especie
 *
 * @apiParams {number=8,16,32,64} grid_res Grid resolution on Km
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *      "grid_res": 64
 *    }
 *
 * @apiSuccess {String} type geometry type supported by GeoJson spec
 * @apiSuccess {Object} crs coordinate reference system object
 * @apiSuccess {list} features list with geometry features coordinate reference system object
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "type": "FeatureCollection",
 *      "crs": {
 *               "type": "name",
 *               "properties": {
 *                               "name": "urn:ogc:def:crs:EPSG::4326"
 *                             }
 *             },
 *      "features": [
 *                    {
 *                      "type": "Feature",
 *                      "geometry": {
 *                                    "type": "Polygon",
 *                                    "coordinates": [
 *                                                     [
 *                                                       [
 *                                                         -91.4844285347321,
 *                                                         17.3362337317245
 *                                                       ],
 *                                                       [
 *                                                         -91.4844285347321,
 *                                                         17.4048214660772
 *                                                       ],
 *                                                       [
 *                                                         -91.4125633120025,
 *                                                         17.4048214660772
 *                                                       ],
 *                                                       [
 *                                                         -91.4125633120025,
 *                                                         17.3362337317245
 *                                                       ],
 *                                                       [
 *                                                         -91.4844285347321,
 *                                                         17.3362337317245
 *                                                       ]
 *                                                     ]
 *                                                   ]
 *                                  },
 *                      "properties":
 *                                  {
 *                                    "gridid":
 *                                    235196
 *                                  }
 *                    }, ...
 *                  ]
 *    }
 */
router.route('/especie/getGridGeoJson')
  .get(verbsCtrl.getGridGeoJsonNiche)
  .post(verbsCtrl.getGridGeoJsonNiche)

router.route('/especie/getValidationTables')
  .get(verbsCtrl.getValidationTables)
  .post(verbsCtrl.getValidationTables)

router.route('/especie/processValidationTables')
  .get(verbsCtrl.processValidationTables)
  .post(verbsCtrl.processValidationTables)

router.route('/especie/deleteValidationTables')
  .get(verbsCtrl.deleteValidationTables)
  .post(verbsCtrl.deleteValidationTables)

/**
 * @api {post} /niche/especie/getCountGridid
 * @apiName getCountGridid
 * @apiGroup Especie
 *
 * @apiParams {number[]} spids Array with spids to count over grid
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *      "spids": [8920, 27333]
 *    }
 *
 * @apiSuccess {Object[]} data object with gridid and species counts
 * @apiSuccess {number} data.gridid grid id
 * @apiSuccess {number} data.cont cell species counts
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "data": [
 *        {
 *          "gridid": 9480,
 *          "cont": "1"
 *        },
 *        {
 *          "gridid": 9484,
 *          "cont": "1"
 *        }
 *      ]
 *    }
 */
router.route('/especie/getCountGridid')
  .get(verbsCtrl.getCountGridid)
  .post(verbsCtrl.getCountGridid)

/**
 * @api {post} /niche/especie/getVariables
 * @apiName getVariables
 * @apiGroup Especie
 *
 * @apiParams {String} field Taxonomic level to query
 * @apiParams {String} parentfield Parent taxonomic level
 * @apiParams {String} parentitem Value of parent taconomic level
 *
 * @apiParamExample {json} Request-Example:
 *    {
 *      "field": "ordenvalido",
 *      "parentfield": "clasevalida",
 *      "parentitem": "Amphibia"
 *    }
 *
 * @apiSuccess {Object[]} Data object with available taxa and species counts
 *
 * @apiSuccessExample Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "data": [
 *        {
 *          "name": "Anura",
 *          "spp": "239"
 *        },
 *        {
 *          "name": "Caudata",
 *          "spp": "140"
 *        },
 *        {
 *          "Gymnophiona",
 *          "spp": "2"
 *        }
 *      ]
 *    }
 */
router.route('/especie/getVariables')
  .get(verbsCtrl.getVariablesNiche)
  .post(verbsCtrl.getVariablesNiche)


router.route('/especie/getRasterVariables')
  .get(verbsCtrl.getRasterNiche)
  .post(verbsCtrl.getRasterNiche)


router.route('/especie/getAvailableVariables')
  .get(verbsCtrl.getAvailableVariables)
  .post(verbsCtrl.getAvailableVariables)


// router.route('/especie/getRasterVariables')
//   .get(verbsCtrl.getRasterNiche)
//   .post(verbsCtrl.getRasterNiche)


router.route('/especie/getGridids')
  .get(verbsCtrl.getGrididsNiche)
  .post(verbsCtrl.getGrididsNiche)


router.route('/especie/getSpecies')
  .get(verbsCtrl.getSpeciesNiche)
  .post(verbsCtrl.getSpeciesNiche)


module.exports = router
