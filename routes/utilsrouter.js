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
router.route('/especie')
  .get(
    verbsCtrl.getValuesFromToken,
    verbsCtrl.getToken,
    verbsCtrl.getValidationTables,
    verbsCtrl.processValidationTables,
    verbsCtrl.deleteValidationTables,
    verbsCtrl.getGridGeoJsonNiche,
    verbsCtrl.getVariablesNiche,
    verbsCtrl.getRasterNiche,
    verbsCtrl.getCountGridid,  
    verbsCtrl.getGrididsNiche,  
    verbsCtrl.getSpeciesNiche,
    verbsCtrl.getEntListNiche
  )
  .post(
    verbsCtrl.getValuesFromToken,
    verbsCtrl.getToken,
    verbsCtrl.getValidationTables,
    verbsCtrl.processValidationTables,
    verbsCtrl.deleteValidationTables,
    verbsCtrl.getGridGeoJsonNiche,
    verbsCtrl.getVariablesNiche,
    verbsCtrl.getRasterNiche,
    verbsCtrl.getCountGridid,  
    verbsCtrl.getGrididsNiche,  
    verbsCtrl.getSpeciesNiche,
    verbsCtrl.getEntListNiche
  )

module.exports = router
