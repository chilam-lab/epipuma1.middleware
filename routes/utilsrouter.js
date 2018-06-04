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
 * @apiSuccess {Object} Data object with the matching species information
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

router.route('/especie/getCountGridid')
  .get(verbsCtrl.getCountGridid)
  .post(verbsCtrl.getCountGridid)




router.route('/especie/getVariables')
  .get(verbsCtrl.getVariablesNiche)
  .post(verbsCtrl.getVariablesNiche)


router.route('/especie/getRasterVariables')
  .get(verbsCtrl.getRasterNiche)
  .post(verbsCtrl.getRasterNiche)


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
