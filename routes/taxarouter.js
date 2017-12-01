/*
* @Author: Raul Sierra
* @Date:   2017-11-28 15:47:33
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-12-01 09:38:51
*/
var router = require('express').Router()

/**
 * Express router que monta las funciones asociadas a redes. 
 * @type {object}
 * @const
 * @namespace netRouter
 */
var router = require('express').Router()
var taxa_controller = require('../controllers/taxa')

/**
 * Ruta que obtiene las aristas de las relaciones 
 * @name get/getEdges
 * @function
 * @memberof module:routes/networkrouter~netRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.route('/children')
  .get(taxa_controller.pipe)
  .post(taxa_controller.pipe)

router.route('/:id')
  .get(taxa_controller.getTaxonData)


 module.exports = router