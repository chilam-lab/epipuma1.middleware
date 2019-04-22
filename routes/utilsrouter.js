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

router.route('/especie/getEntList')
  .get(verbsCtrl.getEntListNiche)
  .post(verbsCtrl.getEntListNiche)

router.route('/especie/getEntListByTaxon')
  .get(verbsCtrl.getEntListByTaxonNiche)
  .post(verbsCtrl.getEntListByTaxonNiche)

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


router.route('/especie/getSpeciesArray')
  .get(verbsCtrl.getSpeciesArrayNiche)
  .post(verbsCtrl.getSpeciesArrayNiche)

router.route('/especie/getSpeciesTaxon')
  .get(verbsCtrl.getSpeciesTaxonNiche)
  .post(verbsCtrl.getSpeciesTaxonNiche)


router.route('/especie/getSubAOI')
  .post(verbsCtrl.getSubAOI)


router.route('/especie/getN')
  .get(verbsCtrl.getN)
  .post(verbsCtrl.getN)


router.route('/especie/getAvailableCountries')
  .get(verbsCtrl.getAvailableCountries)
  .post(verbsCtrl.getAvailableCountries)  


router.route('/especie/getAvailableCountriesFootprint')
  .get(verbsCtrl.getAvailableCountriesFootprint)
  .post(verbsCtrl.getAvailableCountriesFootprint)  


router.route('/especie/getIdFromName')
  .get(verbsCtrl.getIdFromName)
  .post(verbsCtrl.getIdFromName)  


module.exports = router
