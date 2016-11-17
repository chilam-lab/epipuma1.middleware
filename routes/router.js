var router = require('express').Router()
var verbsCtrl = require('../controllers/verbs')

router.all('/', function(req, res) {
  res.json(
    { data: { 
      message: '¡Yey! Bienvenido al API de SNIB'
    }}
  )
})

router.route('/getGridIds')
  .get(verbsCtrl.getGridIds)

router.route('/getSpecie')
  .get(
    verbsCtrl.getSpeciesByName, 
    verbsCtrl.getSpecies
  )
  .post(
    verbsCtrl.getSpeciesByName, 
    verbsCtrl.getSpecies
  )

router.route('/getSpecie/:specieId')
  .get(verbsCtrl.infoSpecie)
  .post(verbsCtrl.infoSpecie)

router.route('/getInteractionCount')
  .get(verbsCtrl.getCountGridid)
  .post(verbsCtrl.getCountGridid)

router.route('/getCountByGroup')
  .get(verbsCtrl.getCountByGroup)
  .post(verbsCtrl.getCountByGroup)

router.route('/getRasterVariables/:type/:layer')
  .get(
    verbsCtrl.getClimaLayer,
    verbsCtrl.getTopoLayer
  )
router.route('/getRasterVariables/:type/')
  .get(
    verbsCtrl.getClimaVars, 
    verbsCtrl.getTopoVars
  )

module.exports = router
