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


// getGeoRel no realiza calculo utilizando apriori o mapa de probabilidad, 
// se descartan estos casos
router.route('/getGeoRel')
  .get(
    verbsCtrl.getGeoRel_VT,
    verbsCtrl.getGeoRel_V,
    verbsCtrl.getGeoRel_T,
    verbsCtrl.getGeoRel    
  )
  .post(
    verbsCtrl.getGeoRel_VT,
    verbsCtrl.getGeoRel_V,
    verbsCtrl.getGeoRel_T,
    verbsCtrl.getGeoRel 
  )

// getFreq no realiza calculo utilizando apriori o mapa de probabilidad, 
// se descartan estos casos
router.route('/getFreq')
  .get(
    verbsCtrl.getFreq_VT,
    verbsCtrl.getFreq_V,
    verbsCtrl.getFreq_T,
    verbsCtrl.getFreq    
  )
  .post(
    verbsCtrl.getFreq_VT,
    verbsCtrl.getFreq_V,
    verbsCtrl.getFreq_T,
    verbsCtrl.getFreq 
  )

router.route('/getFreqCelda')
  .get(
    verbsCtrl.getFreqCelda_VTA,
    verbsCtrl.getFreqCelda_VA,
    verbsCtrl.getFreqCelda_VT,
    verbsCtrl.getFreqCelda_TA,
    verbsCtrl.getFreqCelda_A,
    verbsCtrl.getFreqCelda_V,
    verbsCtrl.getFreqCelda_T,
    verbsCtrl.getFreqCelda    
  )
  .post(
    verbsCtrl.getFreqCelda_VTA,
    verbsCtrl.getFreqCelda_VA,
    verbsCtrl.getFreqCelda_VT,
    verbsCtrl.getFreqCelda_TA,
    verbsCtrl.getFreqCelda_A,
    verbsCtrl.getFreqCelda_V,
    verbsCtrl.getFreqCelda_T,
    verbsCtrl.getFreqCelda 
  )

  // La validacion no es considerada en el mapa
  // Mapa de probabilidad y apriori no existe, si se da esta selcción se manda a mapa probabilidad
  router.route('/getFreqMap')
  .get(
    verbsCtrl.getFreqMap_TM,
    verbsCtrl.getFreqMap_TA,
    verbsCtrl.getFreqMap_M, 
    verbsCtrl.getFreqMap_A,
    verbsCtrl.getFreqMap_T,
    verbsCtrl.getFreqMap    
  )
  .post(
    verbsCtrl.getFreqMap_TM,
    verbsCtrl.getFreqMap_TA,
    verbsCtrl.getFreqMap_M, 
    verbsCtrl.getFreqMap_A,
    verbsCtrl.getFreqMap_T,
    verbsCtrl.getFreqMap 
  )

  router.route('/getScoreDecil')
  .get(
    verbsCtrl.getScoreDecil_VTA,
    verbsCtrl.getScoreDecil_VT,
    verbsCtrl.getScoreDecil_VA,
    verbsCtrl.getScoreDecil_TA,
    verbsCtrl.getScoreDecil_A,
    verbsCtrl.getScoreDecil_V,
    verbsCtrl.getScoreDecil_T,
    verbsCtrl.getScoreDecil   
  )
  .post(
    verbsCtrl.getScoreDecil_VTA,
    verbsCtrl.getScoreDecil_VT,
    verbsCtrl.getScoreDecil_VA,
    verbsCtrl.getScoreDecil_TA,
    verbsCtrl.getScoreDecil_A,
    verbsCtrl.getScoreDecil_V,
    verbsCtrl.getScoreDecil_T,
    verbsCtrl.getScoreDecil   
  )

  router.route("/getUtilGeoportal")
  .get(
      verbsCtrl.getGridSpecies
  )
  .post(
    verbsCtrl.getGridSpecies
  )

module.exports = router
