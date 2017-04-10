/** Express router que proveé las rutas asociadas a redes
 * @module routes/networkrouter
 * @requires express
 */


/**
 * Express router que monta las funciones asociadas a redes. 
 * @type {object}
 * @const
 * @namespace netRouter
 */
var router = require('express').Router()
var getEdgesNiche = require('../controllers/getEdgesNiche')
var getNodesNiche = require('../controllers/getNodesNiche')


/**
 * Ruta que obtiene las aristas de las relaciones 
 * @name get/getEdges
 * @function
 * @memberof module:routes/networkrouter~netRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getEdges')
  .get(getEdgesNiche.pipe)
  .post(getEdgesNiche.pipe)


/**
 * Ruta que obtiene los nodos de la grafica de releaciones 
 * @name get/getNodes
 * @function
 * @memberof module:routes/networkrouter~netRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/getNodes')
  .get(getNodesNiche.pipe)
  .post(getNodesNiche.pipe)


module.exports = router
