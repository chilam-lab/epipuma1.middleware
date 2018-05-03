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
var getCounts = require('../controllers/getCounts')
var getFreqNiche = require('../controllers/getFreqNiche')
var getCellScore = require('../controllers/getCellScoreNiche') 
var getFreqCeldaNiche = require('../controllers/getFreqCeldaNiche') 
var getScoreDecilNiche = require('../controllers/getScoreDecilNiche') 
var getScoreDecilMd = require('../controllers/getScoreDecilMd') 
var getGridSpeciesNiche = require('../controllers/getGridSpeciesNiche')
var gridScores = require('../controllers/getGridScores') 
var bioScores = require('../controllers/getBioScores') 
var mdAtenticacion = require("../md-auth/autenticacion.js")


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
 * @name get/getCellScore
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
// router.route('/getFreqMap')
router.route('/getCellScore')
  .get(getCellScore.pipe)
  .post(getCellScore.pipe)


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
router.route('/getScoreDecilOld')
  .get(getScoreDecilNiche.pipe)
  .post(getScoreDecilNiche.pipe)



/**
 * Ruta que obtiene los deciles del score 
 * @name get/getScoreDecilMd
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getScoreDecil')
  // .get(mdAtenticacion.validaToken, getScoreDecilMd.getScoreDecil)
  // .post(mdAtenticacion.validaToken, getScoreDecilMd.getScoreDecil)
  .get(getScoreDecilMd.getScoreDecil)
  .post(getScoreDecilMd.getScoreDecil)




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

/**
 * Ruta que obtiene el score por celda con metodos para definir que celdas del grid se usan en el analisis
 * @name get/cells_score
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/grid_scores')
  .get(gridScores.pipe)
  .post(gridScores.pipe)

/**
 * Ruta que obtiene el score de una especie VS un grupo de especies con metodos para definir que celdas del grid se usan en el analisis
 * @name get/bio_scores
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/bio_scores')
  .get(bioScores.pipe)
  .post(bioScores.pipe)


/**
 * Ruta que calcula los conteos, epsilon y score entre la especie objetivo y el grupo de variables elegidas. 
 * @name get/bio_scores
 * @function
 * @memberof module:routes/nicherouter~nicheRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/counts')
  // .get(mdAtenticacion.validaToken, getCounts.getBasicInfo)
  // .post(mdAtenticacion.validaToken, getCounts.getBasicInfo)
  .get(getCounts.getBasicInfo)
  .post(getCounts.getBasicInfo)

module.exports = router
