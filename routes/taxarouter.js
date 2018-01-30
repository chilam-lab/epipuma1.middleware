/*
* @Author: Raul Sierra
* @Date:   2017-11-28 15:47:33
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-01-24 11:33:04
*/
var router = require('express').Router()

/**
 * Express router que monta las funciones para obtener info sobre taxa. 
 * @type {object}
 * @const
 * @namespace taxaRouter
 */
var router = require('express').Router()
var taxa_controller = require('../controllers/taxa')

/**
 * Ruta que muestra un mensaje de bienvenida 
 * @name all/
 * @function
 * @memberof module:routes/taxarouter~taxaRouter
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.all('/', function(req, res) {
  res.json(
    { data: { 
      message: 'Hola, este endpoint contiene servicios para obtener info taxonomica'
    }}
  )
})

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