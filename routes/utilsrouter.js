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

router.route('/especie/setUserReg')
  .post(verbsCtrl.setUserReg)

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
  


  


router.route('/especie')
  .get(
    // verbsCtrl.getValuesFromToken,
    // verbsCtrl.getToken,
    verbsCtrl.getValidationTables,
    verbsCtrl.processValidationTables,
    verbsCtrl.deleteValidationTables,
    // verbsCtrl.getGridGeoJsonNiche,
    verbsCtrl.getVariablesNiche,
    verbsCtrl.getRasterNiche,
    verbsCtrl.getCountGridid,  
    verbsCtrl.getGrididsNiche,  
    verbsCtrl.getSpeciesNiche
    // verbsCtrl.getEntListNiche
    // verbsCtrl.getUserReg
    // verbsCtrl.setUserReg
  )
  .post(
    // verbsCtrl.getValuesFromToken,
    // verbsCtrl.getToken,
    verbsCtrl.getValidationTables,
    verbsCtrl.processValidationTables,
    verbsCtrl.deleteValidationTables,
    // verbsCtrl.getGridGeoJsonNiche,
    verbsCtrl.getVariablesNiche,
    verbsCtrl.getRasterNiche,
    verbsCtrl.getCountGridid,  
    verbsCtrl.getGrididsNiche,  
    verbsCtrl.getSpeciesNiche
    // verbsCtrl.getEntListNiche
    // verbsCtrl.getUserReg,
    // verbsCtrl.setUserReg
  )


module.exports = router
