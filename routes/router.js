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
    verbsCtrl.getGroupsByName,
    verbsCtrl.getSpeciesByName, 
    verbsCtrl.getSpecies
  )
  .post(
    verbsCtrl.getGroupsByName,
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

router.route('/getStates')
  .get(verbsCtrl.getStates)
  .post(verbsCtrl.getStates)

router.route('/getUserReg')
  .get(verbsCtrl.getUserReg)
  .post(verbsCtrl.getUserReg)


// getGeoRel no realiza calculo utilizando apriori o mapa de probavilidad, 
// se descartan estos casos
router.route('/getGeoRel')
  .get(
    // verbsCtrl.getGeoRel_VAT,
    // verbsCtrl.getGeoRel_VMT,
    // verbsCtrl.getGeoRel_VA,
    // verbsCtrl.getGeoRel_VM,
    verbsCtrl.getGeoRel_VT,
    // verbsCtrl.getGeoRel_TA,
    // verbsCtrl.getGeoRel_TM,
    verbsCtrl.getGeoRel_V,
    // verbsCtrl.getGeoRel_A,
    // verbsCtrl.getGeoRel_M,
    verbsCtrl.getGeoRel_T,
    verbsCtrl.getGeoRel    
  )
  .post(
    // verbsCtrl.getGeoRel_VAT,
    // verbsCtrl.getGeoRel_VMT,
    // verbsCtrl.getGeoRel_VA,
    // verbsCtrl.getGeoRel_VM,
    verbsCtrl.getGeoRel_VT,
    // verbsCtrl.getGeoRel_TA,
    // verbsCtrl.getGeoRel_TM,
    verbsCtrl.getGeoRel_V,
    // verbsCtrl.getGeoRel_A,
    // verbsCtrl.getGeoRel_M,
    verbsCtrl.getGeoRel_T,
    verbsCtrl.getGeoRel 
  )

  // getGeoRel no realiza calculo utilizando apriori o mapa de probavilidad, 
// se descartan estos casos
router.route('/getFreq')
  .get(
    // verbsCtrl.getGeoRel_VAT,
    // verbsCtrl.getGeoRel_VMT,
    // verbsCtrl.getGeoRel_VA,
    // verbsCtrl.getGeoRel_VM,
    // verbsCtrl.getGeoRel_VT,
    // verbsCtrl.getGeoRel_TA,
    // verbsCtrl.getGeoRel_TM,
    verbsCtrl.getFreq_V,
    // verbsCtrl.getGeoRel_A,
    // verbsCtrl.getGeoRel_M,
    verbsCtrl.getFreq_T,
    verbsCtrl.getFreq    
  )
  .post(
    // verbsCtrl.getGeoRel_VAT,
    // verbsCtrl.getGeoRel_VMT,
    // verbsCtrl.getGeoRel_VA,
    // verbsCtrl.getGeoRel_VM,
    // verbsCtrl.getGeoRel_VT,
    // verbsCtrl.getGeoRel_TA,
    // verbsCtrl.getGeoRel_TM,
    verbsCtrl.getFreq_V,
    // verbsCtrl.getGeoRel_A,
    // verbsCtrl.getGeoRel_M,
    verbsCtrl.getFreq_T,
    verbsCtrl.getFreq 
  )

module.exports = router
