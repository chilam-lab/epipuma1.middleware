/** Express router que proveé las rutas asociadas a niche
 * @module routes/nicherouter
 * @requires express
 */


/**
 * Express router que monta las funciones asociadas a niche. 
 * @type {object}
 * @const
 * @namespace nicheRouter
 */
var router = require('express').Router()
var verbsCtrl = require('../controllers/verbsniche')


/**
 * Ruta que muestra un mensaje de bienvenida 
 * @name all/
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.all('/', function(req, res) {
  res.json(
    { data: { 
      message: '¡Yey! Bienvenido al API de NICHE'
    }}
  )
})

/**
 * Ruta que calcula el score entre las variables elegidas. 
 * @name get/getGeoRel
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getGeoRel')
  .get(
    verbsCtrl.getGeoRelNiche_VT,
    verbsCtrl.getGeoRelNiche_V,
    verbsCtrl.getGeoRelNiche_T,
    verbsCtrl.getGeoRelNiche    
  )
  .post(
    verbsCtrl.getGeoRelNiche_VT,
    verbsCtrl.getGeoRelNiche_V,
    verbsCtrl.getGeoRelNiche_T,
    verbsCtrl.getGeoRelNiche
  )


/**
 * Ruta que obtiene las frecuencia de epsilon y score por especie.
 * @name get/getFreq
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getFreq')
  .get(
    verbsCtrl.getFreqNiche_VT,
    verbsCtrl.getFreqNiche_V,
    verbsCtrl.getFreqNiche_T,
    verbsCtrl.getFreqNiche    
  )
  .post(
    verbsCtrl.getFreqNiche_VT,
    verbsCtrl.getFreqNiche_V,
    verbsCtrl.getFreqNiche_T,
    verbsCtrl.getFreqNiche 
  )


/**
 * Ruta que obtiene la suma del score por celda.
 * @name get/getFreqMap
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getFreqMap')
  .get(
    // verbsCtrl.getFreqMap_TM,
    // verbsCtrl.getFreqMap_TA,
    verbsCtrl.getFreqMapNiche_M,
    verbsCtrl.getFreqMapNiche_A,
    verbsCtrl.getFreqMapNiche_T,
    verbsCtrl.getFreqMapNiche    
  )
  .post(
    // verbsCtrl.getFreqMap_TM,
    // verbsCtrl.getFreqMap_TA,
    verbsCtrl.getFreqMapNiche_M,
    verbsCtrl.getFreqMapNiche_A,
    verbsCtrl.getFreqMapNiche_T,
    verbsCtrl.getFreqMapNiche 
  )


/**
 * Ruta que obtiene la frecuencia del score por celda.
 * @name get/getFreqCelda
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getFreqCelda')
  .get(
    // verbsCtrl.getFreqCelda_VTA,
    // verbsCtrl.getFreqCelda_VA,
    // verbsCtrl.getFreqCelda_VT,
    // verbsCtrl.getFreqCelda_TA,
    verbsCtrl.getFreqCeldaNiche_A,
    verbsCtrl.getFreqCeldaNiche_V,
    verbsCtrl.getFreqCeldaNiche_T,
    verbsCtrl.getFreqCeldaNiche    
  )
  .post(
    // verbsCtrl.getFreqCelda_VTA,
    // verbsCtrl.getFreqCelda_VA,
    // verbsCtrl.getFreqCelda_VT,
    // verbsCtrl.getFreqCelda_TA,
    verbsCtrl.getFreqCeldaNiche_A,
    verbsCtrl.getFreqCeldaNiche_V,
    verbsCtrl.getFreqCeldaNiche_T,
    verbsCtrl.getFreqCeldaNiche 
  )


/**
 * Ruta que obtiene los deciles del score 
 * @name get/getScoreDecil
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getScoreDecil')
  .get(
    // verbsCtrl.getScoreDecil_VTA,
    // verbsCtrl.getScoreDecil_VT,
    // verbsCtrl.getScoreDecil_VA,
    // verbsCtrl.getScoreDecil_TA,
    verbsCtrl.getScoreDecilNiche_A,
    verbsCtrl.getScoreDecilNiche_V,
    verbsCtrl.getScoreDecilNiche_T,
    verbsCtrl.getScoreDecilNiche   
  )
  .post(
    // verbsCtrl.getScoreDecil_VTA,
    // verbsCtrl.getScoreDecil_VT,
    // verbsCtrl.getScoreDecil_VA,
    // verbsCtrl.getScoreDecil_TA,
    verbsCtrl.getScoreDecilNiche_A,
    verbsCtrl.getScoreDecilNiche_V,
    verbsCtrl.getScoreDecilNiche_T,
    verbsCtrl.getScoreDecilNiche   
  )


/**
 * Ruta que obtiene el score por celda agrupado por decil
 * @name get/getGridSpecies
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getGridSpecies')
  .get(
    verbsCtrl.getGridSpeciesNiche_M,
    verbsCtrl.getGridSpeciesNiche_A,
    verbsCtrl.getGridSpeciesNiche_T,
    verbsCtrl.getGridSpeciesNiche        
  )
  .post(
    verbsCtrl.getGridSpeciesNiche_M,
    verbsCtrl.getGridSpeciesNiche_A,
    verbsCtrl.getGridSpeciesNiche_T,
    verbsCtrl.getGridSpeciesNiche        
  )

module.exports = router
