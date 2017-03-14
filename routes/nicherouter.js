var router = require('express').Router()
var verbsCtrl = require('../controllers/verbs')

router.all('/', function(req, res) {
  res.json(
    { data: { 
      message: '¡Yey! Bienvenido al API de NICHE'
    }}
  )
})

/**************************************************************************************************************************/
/**************************************************************************************************************************/
/**************************************************************************************************************************/
/************************************************************* VERBOS PARA EL NUEVO SERVIDOR ******************************/


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


  router.route('/getScoreDecil')
    .get(
      // verbsCtrl.getScoreDecil_VTA,
      // verbsCtrl.getScoreDecil_VT,
      // verbsCtrl.getScoreDecil_VA,
      // verbsCtrl.getScoreDecil_TA,
      // verbsCtrl.getScoreDecil_A,
      verbsCtrl.getScoreDecilNiche_V,
      verbsCtrl.getScoreDecilNiche_T,
      verbsCtrl.getScoreDecilNiche   
    )
    .post(
      // verbsCtrl.getScoreDecil_VTA,
      // verbsCtrl.getScoreDecil_VT,
      // verbsCtrl.getScoreDecil_VA,
      // verbsCtrl.getScoreDecil_TA,
      // verbsCtrl.getScoreDecil_A,
      verbsCtrl.getScoreDecilNiche_V,
      verbsCtrl.getScoreDecilNiche_T,
      verbsCtrl.getScoreDecilNiche   
    )



  router.route('/especie')
    .get(
      verbsCtrl.getCountGridid,  
      verbsCtrl.getGrididsNiche,  
      verbsCtrl.getSpeciesNiche,  
      verbsCtrl.getEntListNiche  
    )
    .post(
      verbsCtrl.getCountGridid,  
      verbsCtrl.getGrididsNiche,  
      verbsCtrl.getSpeciesNiche,
      verbsCtrl.getEntListNiche
    )

  
module.exports = router
