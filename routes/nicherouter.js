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
var getGeoRel = require('../controllers/getGeoRelNiche')
var getFreqNiche = require('../controllers/getFreqNiche')
var getFreqMapNiche = require('../controllers/getFreqMapNiche') 
var getFreqCeldaNiche = require('../controllers/getFreqCeldaNiche') 
var getScoreDecilNiche = require('../controllers/getScoreDecilNiche') 
var getGridSpeciesNiche = require('../controllers/getGridSpeciesNiche') 


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
  .get(getGeoRel.pipe)
  .post(getGeoRel.pipe)


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
  .get(getFreqNiche.pipe)
  .post(getFreqNiche.pipe)


/**
 * Ruta que obtiene la suma del score por celda.
 * @name get/getFreqMap
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
// router.route('/getFreqMap')
router.route('/getCellScore')
  .get(getFreqMapNiche.pipe)
  .post(getFreqMapNiche.pipe)


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
  .get(getFreqCeldaNiche.pipe)
  .post(getFreqCeldaNiche.pipe)


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
  .get(getScoreDecilNiche.pipe)
  .post(getScoreDecilNiche.pipe)


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
  .get(getGridSpeciesNiche.pipe)
  .post(getGridSpeciesNiche.pipe)


module.exports = router
