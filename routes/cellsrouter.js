/*
* @Author: Raul Sierra
* @Date:   2017-10-25 17:53:12
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-10-25 18:17:18
*/
/**
 * Express router que monta las funciones asociadas a celdas. 
 * @type {object}
 * @const
 * @namespace cellsRouter
 */
var router = require('express').Router()

/**
 * Express router que monta las funciones asociadas a redes. 
 * @type {object}
 * @const
 * @namespace netRouter
 */
var router = require('express').Router()
var cells_controller = require('../controllers/cells')

/**
 * Ruta que obtiene las aristas de las relaciones 
 * @name get/getEdges
 * @function
 * @memberof module:routes/networkrouter~netRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/cells')
  .get(cells_controller.pipe)
  .post(cells_controller.pipe)

 module.exports = router
