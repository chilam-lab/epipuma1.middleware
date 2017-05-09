/**
* Módulo que es responsable proveer las consultas que utilizan los verbos. 
*
* @exports controllers/sql/queryProvider
* @requires pg-promise.QueryFile
* @requires path
*/
var QueryFile = require('pg-promise').QueryFile
var path = require('path')

function sqlPath (file) {
  var fullPath = path.join(__dirname, file)
  return QueryFile(fullPath)
}

/* 
 * Objeto que provee las consultas para los verbos
 */
var queryProvider = {
  grid: {
    getIds: sqlPath('grid/get_ids.sql')
  },
  layers: {
    getStatesMX: sqlPath('layers/get_states.sql')
  },
  users: {
    getUser: sqlPath('users/getUserReg.sql')
  },
  specie: {
    getAll: sqlPath('specie/get_all.sql'),
    getByName: sqlPath('specie/get_specie_by_name.sql'),
    getFieldByName: sqlPath('specie/get_group_by_name.sql'),
    getInfo: sqlPath('specie/get_info_specie.sql')
  },
  getGeoRel: {
    getGeoRel: sqlPath('getGeoRel/get_basic_geo_rel.sql'),
    getGeoRelBio: sqlPath('getGeoRel/get_basic_geo_rel_bio.sql'),
    getGeoRelRaster: sqlPath('getGeoRel/get_basic_geo_rel_raster.sql'),
        
    getGeoRelBioV: sqlPath('getGeoRel/get_geo_rel_BV.sql'),
    getGeoRelRasterV: sqlPath('getGeoRel/get_geo_rel_RaV.sql'),
    getGeoRelV: sqlPath('getGeoRel/get_geo_rel_V.sql'),

    getGeoRelBioT: sqlPath('getGeoRel/get_geo_rel_BT.sql'),
    getGeoRelRasterT: sqlPath('getGeoRel/get_geo_rel_RaT.sql'),
    getGeoRelT: sqlPath('getGeoRel/get_geo_rel_T.sql'),

    getGeoRelBioVT: sqlPath('getGeoRel/get_geo_rel_BVT.sql'),
    getGeoRelVT: sqlPath('getGeoRel/get_geo_rel_TVT.sql'),
    getGeoRelRaVT: sqlPath('getGeoRel/get_geo_rel_RaVT.sql')
  },
  getFreq: {
    getFreqBio: sqlPath('getFreq/get_basic_freq_bio.sql'),
    getFreqRaster: sqlPath('getFreq/get_basic_freq_raster.sql'),
    getFreq: sqlPath('getFreq/get_basic_freq.sql'),

    getFreqBioV: sqlPath('getFreq/get_freq_BV.sql'),
    getFreqRasterV: sqlPath('getFreq/get_freq_RaV.sql'),
    getFreqV: sqlPath('getFreq/get_freq_V.sql'),

    getFreqBioT: sqlPath('getFreq/get_freq_BT.sql'),
    getFreqRasterT: sqlPath('getFreq/get_freq_RaT.sql'),
    getFreqT: sqlPath('getFreq/get_freq_T.sql'),

    getFreqBioVT: sqlPath('getFreq/get_freq_BVT.sql'),
    getFreqRaVT: sqlPath('getFreq/get_freq_RaVT.sql'),
    getFreqVT: sqlPath('getFreq/get_freq_TVT.sql')
  },
  getFreqCelda: {
    getFreqCeldaBio: sqlPath('getFreqCelda/get_basic_freq_celda_bio.sql'),
    getFreqCeldaRaster: sqlPath('getFreqCelda/get_basic_freq_celda_raster.sql'),
    getFreqCelda: sqlPath('getFreqCelda/get_basic_freq_celda.sql'),

    getFreqCeldaBioT: sqlPath('getFreqCelda/get_freq_celda_BT.sql'),
    getFreqCeldaRaT: sqlPath('getFreqCelda/get_freq_celda_RaT.sql'),
    getFreqCeldaT: sqlPath('getFreqCelda/get_freq_celda_T.sql'),

    getFreqCeldaBioV: sqlPath('getFreqCelda/get_freq_celda_BV.sql'),
    getFreqCeldaRaV: sqlPath('getFreqCelda/get_freq_celda_RaV.sql'),
    getFreqCeldaV: sqlPath('getFreqCelda/get_freq_celda_V.sql'),

    getFreqCeldaBioA: sqlPath('getFreqCelda/get_freq_celda_BA.sql'),
    getFreqCeldaRaA: sqlPath('getFreqCelda/get_freq_celda_RaA.sql'),
    getFreqCeldaA: sqlPath('getFreqCelda/get_freq_celda_A.sql'),

    getFreqCeldaBioTA: sqlPath('getFreqCelda/get_freq_celda_BTA.sql'),
    getFreqCeldaRaTA: sqlPath('getFreqCelda/get_freq_celda_RaTA.sql'),
    getFreqCeldaTA: sqlPath('getFreqCelda/get_freq_celda_TA.sql'),

    // por desarrollar
    getFreqCeldaBioVT: sqlPath('getFreqCelda/get_freq_celda_BVT.sql'),
    getFreqCeldaRaVT: sqlPath('getFreqCelda/get_freq_celda_RaVT.sql'),
    getFreqCeldaVT: sqlPath('getFreqCelda/get_freq_celda_VT.sql'),

    getFreqCeldaBioVA: sqlPath('getFreqCelda/get_freq_celda_BVA.sql'),
    getFreqCeldaRaVA: sqlPath('getFreqCelda/get_freq_celda_RaVA.sql'),
    getFreqCeldaVA: sqlPath('getFreqCelda/get_freq_celda_VA.sql'),

    getFreqCeldaBioVTA: sqlPath('getFreqCelda/get_freq_celda_BVTA.sql'),
    getFreqCeldaRaVTA: sqlPath('getFreqCelda/get_freq_celda_RaVTA.sql'),
    getFreqCeldaVTA: sqlPath('getFreqCelda/get_freq_celda_VTA.sql')

  },
  getFreqMap: {
    getFreqMapBio: sqlPath('getFreqMap/get_basic_freq_map_bio.sql'),
    getFreqMapRaster: sqlPath('getFreqMap/get_basic_freq_map_raster.sql'),
    getFreqMap: sqlPath('getFreqMap/get_basic_freq_map.sql'),

    getFreqMapBioT: sqlPath('getFreqMap/get_freq_map_BT.sql'),
    getFreqMapRaT: sqlPath('getFreqMap/get_freq_map_RaT.sql'),
    getFreqMapT: sqlPath('getFreqMap/get_freq_map_T.sql'),

    // getFreqMapBioV: sqlPath('getFreqMap/get_freq_map_BV.sql'),
    // getFreqMapRaV: sqlPath('getFreqMap/get_freq_map_RaV.sql'),
    // getFreqMapV: sqlPath('getFreqMap/get_freq_map_V.sql')

    getFreqMapBioA: sqlPath('getFreqMap/get_freq_map_BA.sql'),
    getFreqMapRaA: sqlPath('getFreqMap/get_freq_map_RaA.sql'),
    getFreqMapA: sqlPath('getFreqMap/get_freq_map_A.sql'),

    getFreqMapBioM: sqlPath('getFreqMap/get_freq_map_BM.sql'),
    getFreqMapRaM: sqlPath('getFreqMap/get_freq_map_RaM.sql'),
    getFreqMapM: sqlPath('getFreqMap/get_freq_map_M.sql'),

    getFreqMapBioTA: sqlPath('getFreqMap/get_freq_map_BTA.sql'),
    getFreqMapRaTA: sqlPath('getFreqMap/get_freq_map_RaTA.sql'),
    getFreqMapTA: sqlPath('getFreqMap/get_freq_map_TA.sql'),

    getFreqMapBioTM: sqlPath('getFreqMap/get_freq_map_BTM.sql'),
    getFreqMapRaTM: sqlPath('getFreqMap/get_freq_map_RaTM.sql'),
    getFreqMapTM: sqlPath('getFreqMap/get_freq_map_TM.sql')
  },
  getScoreDecil: {
    getScoreDecilBio: sqlPath('getScoreDecil/get_basic_score_decil_bio.sql'),
    getScoreDecilRaster: sqlPath('getScoreDecil/get_basic_score_decil_raster.sql'),
    getScoreDecil: sqlPath('getScoreDecil/get_basic_score_decil.sql'),

    getScoreDecilBioT: sqlPath('getScoreDecil/get_score_decil_BT.sql'),
    getScoreDecilRaT: sqlPath('getScoreDecil/get_score_decil_RaT.sql'),
    getScoreDecilT: sqlPath('getScoreDecil/get_score_decil_T.sql'),

    getScoreDecilBioV: sqlPath('getScoreDecil/get_score_decil_BV.sql'),
    getScoreDecilRaV: sqlPath('getScoreDecil/get_score_decil_RaV.sql'),
    getScoreDecilV: sqlPath('getScoreDecil/get_score_decil_V.sql'),

    getScoreDecilBioA: sqlPath('getScoreDecil/get_score_decil_BA.sql'),
    getScoreDecilRaA: sqlPath('getScoreDecil/get_score_decil_RaA.sql'),
    getScoreDecilA: sqlPath('getScoreDecil/get_score_decil_A.sql'),

    getScoreDecilBioTA: sqlPath('getScoreDecil/get_score_decil_BTA.sql'),
    getScoreDecilRaTA: sqlPath('getScoreDecil/get_score_decil_RaTA.sql'),
    getScoreDecilTA: sqlPath('getScoreDecil/get_score_decil_TA.sql'),

    getScoreDecilBioVA: sqlPath('getScoreDecil/get_score_decil_BVA.sql'),
    getScoreDecilRaVA: sqlPath('getScoreDecil/get_score_decil_RaVA.sql'),
    getScoreDecilVA: sqlPath('getScoreDecil/get_score_decil_VA.sql'),

    getScoreDecilBioVT: sqlPath('getScoreDecil/get_score_decil_BVT.sql'),
    getScoreDecilRaVT: sqlPath('getScoreDecil/get_score_decil_RaVT.sql'),
    getScoreDecilVT: sqlPath('getScoreDecil/get_score_decil_VT.sql'),

    getScoreDecilBioVTA: sqlPath('getScoreDecil/get_score_decil_BVTA.sql'),
    getScoreDecilRaVTA: sqlPath('getScoreDecil/get_score_decil_RaVTA.sql'),
    getScoreDecilVTA: sqlPath('getScoreDecil/get_score_decil_VTA.sql')
  },
  interaction: {
    getCount: sqlPath('interaction/count_interaction.sql')
  },
  snibinfo: {
    getCountByGroup: sqlPath('snib/entries_by_groups.sql')
  },
  rasters: {
    getClimaVariables: sqlPath('rasters/get_clima_vars.sql'),
    getTopoVariables: sqlPath('rasters/get_topo_vars.sql'),
    getClimaLayer: sqlPath('rasters/get_clima_layer.sql'),
    getTopoLayer: sqlPath('rasters/get_topo_layer.sql')
  },
  getUtilGeoportal: {
    getGridSpeciesBio: sqlPath('getUtilGeoportal/get_basic_grid_species_bio.sql'),
    getGridSpeciesRaster: sqlPath('getUtilGeoportal/get_basic_grid_species_raster.sql'),
    getGridSpecies: sqlPath('getUtilGeoportal/get_basic_grid_species.sql'),

    getGridSpeciesBioT: sqlPath('getUtilGeoportal/get_grid_species_BT.sql'),
    getGridSpeciesRaT: sqlPath('getUtilGeoportal/get_grid_species_RaT.sql'),
    getGridSpeciesT: sqlPath('getUtilGeoportal/get_grid_species_T.sql'),

    getGridSpeciesBioA: sqlPath('getUtilGeoportal/get_grid_species_BA.sql'),
    getGridSpeciesRaA: sqlPath('getUtilGeoportal/get_grid_species_RaA.sql'),
    getGridSpeciesA: sqlPath('getUtilGeoportal/get_grid_species_A.sql'),

    getGridSpeciesBioM: sqlPath('getUtilGeoportal/get_grid_species_BM.sql'),
    getGridSpeciesRaM: sqlPath('getUtilGeoportal/get_grid_species_RaM.sql'),
    getGridSpeciesM: sqlPath('getUtilGeoportal/get_grid_species_M.sql'),

    getGridSpeciesBioTA: sqlPath('getUtilGeoportal/get_grid_species_BTA.sql'),
    getGridSpeciesRaTA: sqlPath('getUtilGeoportal/get_grid_species_RaTA.sql'),
    getGridSpeciesTA: sqlPath('getUtilGeoportal/get_grid_species_TA.sql'),

    getGridSpeciesBioTM: sqlPath('getUtilGeoportal/get_grid_species_BTM.sql'),
    getGridSpeciesRaTM: sqlPath('getUtilGeoportal/get_grid_species_RaTM.sql'),
    getGridSpeciesTM: sqlPath('getUtilGeoportal/get_grid_species_TM.sql')
  },


/**************************************************************************************************************************/
/**************************************************************************************************************************/
/**************************************************************************************************************************/
/************************************************************* VERBOS PARA EL NUEVO SERVIDOR ******************************/


/************************************************************* VERBOS ÚTILES ******************************/
  getVariablesNiche: {
    getVariablesReino: sqlPath('niche/especie/get_variables_reino.sql'),
    getVariables: sqlPath('niche/especie/get_variables.sql')
  },
  getRasterNiche: {
    getRasterBios: sqlPath('niche/raster/raster_bios.sql'),
    getRasterIds: sqlPath('niche/raster/raster_ids.sql')
  },
  getSpeciesNiche: {
    getSpecies: sqlPath('niche/especie/getSpecies.sql'),
    getSpeciesSD: sqlPath('niche/especie/getSpecies_sdate.sql'),
    getSpeciesR: sqlPath('niche/especie/getSpecies_range.sql'),
    getSpeciesSDR: sqlPath('niche/especie/getSpecies_sdr.sql')
  },
  getEntListNiche: {
    getEntList: sqlPath('niche/especie/getEntList.sql')
  },
  getGrididsNiche: {
    getGridids: sqlPath('niche/especie/getGridids.sql')
  },
  getCountGridid: {
    getCount: sqlPath('niche/especie/getCountGridid.sql')
  },

  /************************************************************* VERBOS PARA NICHO ******************************/
  getGridSpeciesNiche: {
    getGridSpeciesBio: sqlPath('niche/getGridSpecies/get_grid_species_bio.sql'),
    getGridSpeciesRaster: sqlPath('niche/getGridSpecies/get_grid_species_raster.sql'),
    getGridSpecies: sqlPath('niche/getGridSpecies/get_grid_species.sql'),

    getGridSpeciesBioT: sqlPath('niche/getGridSpecies/get_grid_species_BT.sql'),
    getGridSpeciesRaT: sqlPath('niche/getGridSpecies/get_grid_species_RaT.sql'),
    getGridSpeciesT: sqlPath('niche/getGridSpecies/get_grid_species_T.sql'),

    getGridSpeciesBioA: sqlPath('niche/getGridSpecies/get_grid_species_BA.sql'),
    getGridSpeciesRaA: sqlPath('niche/getGridSpecies/get_grid_species_RaA.sql'),
    getGridSpeciesA: sqlPath('niche/getGridSpecies/get_grid_species_A.sql'),

    getGridSpeciesBioM: sqlPath('niche/getGridSpecies/get_grid_species_BM.sql'),
    getGridSpeciesRaM: sqlPath('niche/getGridSpecies/get_grid_species_RaM.sql'),
    getGridSpeciesM: sqlPath('niche/getGridSpecies/get_grid_species_M.sql')
  },
  getGeoRelNiche: {
    getGeoRel: sqlPath('niche/getGeoRel/get_geo_rel.sql'),
    getGeoRelBio: sqlPath('niche/getGeoRel/get_geo_rel_bio.sql'),
    getGeoRelRaster: sqlPath('niche/getGeoRel/get_geo_rel_raster.sql'),
    
    getGeoRelBioV: sqlPath('niche/getGeoRel/get_geo_rel_BV.sql'),
    getGeoRelRaV: sqlPath('niche/getGeoRel/get_geo_rel_RaV.sql'),
    getGeoRelV: sqlPath('niche/getGeoRel/get_geo_rel_V.sql'),

    getGeoRelBioT: sqlPath('niche/getGeoRel/get_geo_rel_BT.sql'),
    getGeoRelRaT: sqlPath('niche/getGeoRel/get_geo_rel_RaT.sql'),
    getGeoRelT: sqlPath('niche/getGeoRel/get_geo_rel_T.sql'),

    getGeoRelBioVT: sqlPath('niche/getGeoRel/get_geo_rel_BVT.sql'),
    getGeoRelVT: sqlPath('niche/getGeoRel/get_geo_rel_VT.sql'),
    getGeoRelRaVT: sqlPath('niche/getGeoRel/get_geo_rel_RaVT.sql')
  },
  getFreqNiche: {
    getFreqBio: sqlPath('niche/getFreq/get_freq_bio.sql'),
    getFreqRaster: sqlPath('niche/getFreq/get_freq_raster.sql'),
    getFreq: sqlPath('niche/getFreq/get_freq.sql'),

    getFreqBioV: sqlPath('niche/getFreq/get_freq_BV.sql'),
    getFreqRasterV: sqlPath('niche/getFreq/get_freq_RaV.sql'),
    getFreqV: sqlPath('niche/getFreq/get_freq_V.sql'),

    getFreqBioT: sqlPath('niche/getFreq/get_freq_BT.sql'),
    getFreqRasterT: sqlPath('niche/getFreq/get_freq_RaT.sql'),
    getFreqT: sqlPath('niche/getFreq/get_freq_T.sql'),

    getFreqBioVT: sqlPath('niche/getFreq/get_freq_BVT.sql'),
    getFreqRaVT: sqlPath('niche/getFreq/get_freq_RaVT.sql'),
    getFreqVT: sqlPath('niche/getFreq/get_freq_VT.sql')
  },

  getFreqMapNiche: {
    getFreqMapBio: sqlPath('niche/getFreqMap/get_freq_map_bio.sql'),
    getFreqMapRaster: sqlPath('niche/getFreqMap/get_freq_map_raster.sql'),
    getFreqMap: sqlPath('niche/getFreqMap/get_freq_map.sql'),

    getFreqMapBioT: sqlPath('niche/getFreqMap/get_freq_map_BT.sql'),
    getFreqMapRaT: sqlPath('niche/getFreqMap/get_freq_map_RaT.sql'),
    getFreqMapT: sqlPath('niche/getFreqMap/get_freq_map_T.sql'),

    getFreqMapBioA: sqlPath('niche/getFreqMap/get_freq_map_BA.sql'),
    getFreqMapRaA: sqlPath('niche/getFreqMap/get_freq_map_RaA.sql'),
    getFreqMapA: sqlPath('niche/getFreqMap/get_freq_map_A.sql'),

    getFreqMapBioM: sqlPath('niche/getFreqMap/get_freq_map_BM.sql'),
    getFreqMapRaM: sqlPath('niche/getFreqMap/get_freq_map_RaM.sql'),
    getFreqMapM: sqlPath('niche/getFreqMap/get_freq_map_M.sql')

    // getFreqMapBioTA: sqlPath('niche/getFreqMap/get_freq_map_BTA.sql'),
    // getFreqMapRaTA: sqlPath('niche/getFreqMap/get_freq_map_RaTA.sql'),
    // getFreqMapTA: sqlPath('niche/getFreqMap/get_freq_map_TA.sql'),

    // getFreqMapBioTM: sqlPath('niche/getFreqMap/get_freq_map_BTM.sql'),
    // getFreqMapRaTM: sqlPath('niche/getFreqMap/get_freq_map_RaTM.sql'),
    // getFreqMapTM: sqlPath('niche/getFreqMap/get_freq_map_TM.sql')
  },
  getFreqCeldaNiche: {
    getFreqCeldaBio: sqlPath('niche/getFreqCelda/get_freq_celda_bio.sql'),
    getFreqCeldaRaster: sqlPath('niche/getFreqCelda/get_freq_celda_raster.sql'),
    getFreqCelda: sqlPath('niche/getFreqCelda/get_freq_celda.sql'),

    getFreqCeldaBioT: sqlPath('niche/getFreqCelda/get_freq_celda_BT.sql'),
    getFreqCeldaRaT: sqlPath('niche/getFreqCelda/get_freq_celda_RaT.sql'),
    getFreqCeldaT: sqlPath('niche/getFreqCelda/get_freq_celda_T.sql'),

    getFreqCeldaBioV: sqlPath('niche/getFreqCelda/get_freq_celda_BV.sql'),
    getFreqCeldaRaV: sqlPath('niche/getFreqCelda/get_freq_celda_RaV.sql'),
    getFreqCeldaV: sqlPath('niche/getFreqCelda/get_freq_celda_V.sql'),

    getFreqCeldaBioA: sqlPath('niche/getFreqCelda/get_freq_celda_BA.sql'),
    getFreqCeldaRaA: sqlPath('niche/getFreqCelda/get_freq_celda_RaA.sql'),
    getFreqCeldaA: sqlPath('niche/getFreqCelda/get_freq_celda_A.sql')

    // getFreqCeldaBioTA: sqlPath('getFreqCelda/get_freq_celda_BTA.sql'),
    // getFreqCeldaRaTA: sqlPath('getFreqCelda/get_freq_celda_RaTA.sql'),
    // getFreqCeldaTA: sqlPath('getFreqCelda/get_freq_celda_TA.sql'),

    // por desarrollar
    // getFreqCeldaBioVT: sqlPath('getFreqCelda/get_freq_celda_BVT.sql'),
    // getFreqCeldaRaVT: sqlPath('getFreqCelda/get_freq_celda_RaVT.sql'),
    // getFreqCeldaVT: sqlPath('getFreqCelda/get_freq_celda_VT.sql'),

    // getFreqCeldaBioVA: sqlPath('getFreqCelda/get_freq_celda_BVA.sql'),
    // getFreqCeldaRaVA: sqlPath('getFreqCelda/get_freq_celda_RaVA.sql'),
    // getFreqCeldaVA: sqlPath('getFreqCelda/get_freq_celda_VA.sql'),

    // getFreqCeldaBioVTA: sqlPath('getFreqCelda/get_freq_celda_BVTA.sql'),
    // getFreqCeldaRaVTA: sqlPath('getFreqCelda/get_freq_celda_RaVTA.sql'),
    // getFreqCeldaVTA: sqlPath('getFreqCelda/get_freq_celda_VTA.sql')
  },
  getScoreDecilNiche: {
    getScoreDecilBio: sqlPath('niche/getScoreDecil/get_score_decil_bio.sql'),
    getScoreDecilRaster: sqlPath('niche/getScoreDecil/get_score_decil_raster.sql'),
    getScoreDecil: sqlPath('niche/getScoreDecil/get_score_decil.sql'),

    getScoreDecilBioT: sqlPath('niche/getScoreDecil/get_score_decil_BT.sql'),
    getScoreDecilRaT: sqlPath('niche/getScoreDecil/get_score_decil_RaT.sql'),
    getScoreDecilT: sqlPath('niche/getScoreDecil/get_score_decil_T.sql'),

    getScoreDecilBioV: sqlPath('niche/getScoreDecil/get_score_decil_BV.sql'),
    getScoreDecilRaV: sqlPath('niche/getScoreDecil/get_score_decil_RaV.sql'),
    getScoreDecilV: sqlPath('niche/getScoreDecil/get_score_decil_V.sql'),

    getScoreDecilBioA: sqlPath('niche/getScoreDecil/get_score_decil_BA.sql'),
    getScoreDecilRaA: sqlPath('niche/getScoreDecil/get_score_decil_RaA.sql'),
    getScoreDecilA: sqlPath('niche/getScoreDecil/get_score_decil_A.sql')

    // getScoreDecilBioTA: sqlPath('getScoreDecil/get_score_decil_BTA.sql'),
    // getScoreDecilRaTA: sqlPath('getScoreDecil/get_score_decil_RaTA.sql'),
    // getScoreDecilTA: sqlPath('getScoreDecil/get_score_decil_TA.sql'),

    // getScoreDecilBioVA: sqlPath('getScoreDecil/get_score_decil_BVA.sql'),
    // getScoreDecilRaVA: sqlPath('getScoreDecil/get_score_decil_RaVA.sql'),
    // getScoreDecilVA: sqlPath('getScoreDecil/get_score_decil_VA.sql'),

    // getScoreDecilBioVT: sqlPath('getScoreDecil/get_score_decil_BVT.sql'),
    // getScoreDecilRaVT: sqlPath('getScoreDecil/get_score_decil_RaVT.sql'),
    // getScoreDecilVT: sqlPath('getScoreDecil/get_score_decil_VT.sql'),

    // getScoreDecilBioVTA: sqlPath('getScoreDecil/get_score_decil_BVTA.sql'),
    // getScoreDecilRaVTA: sqlPath('getScoreDecil/get_score_decil_RaVTA.sql'),
    // getScoreDecilVTA: sqlPath('getScoreDecil/get_score_decil_VTA.sql')
  },

/************************************************************* VERBOS PARA REDES ******************************/

  getEdgesNiche: {
    // getEdgesNicheBio: sqlPath('niche/getNet/get_edges_bio.sql'),
    // getEdgesNicheRaster: sqlPath('niche/getNet/get_edges_raster.sql'),
    // getEdgesNiche: sqlPath('niche/getNet/get_edges.sql')

    getEdgesNicheBioRaster_BioRaster: sqlPath('niche/getNet/get_edges.sql'),
    
    getEdgesNicheBioRaster_Bio: sqlPath('niche/getNet/get_edges_bioraster_bio.sql'),
    getEdgesNicheBioRaster_Raster: sqlPath('niche/getNet/get_edges_bioraster_raster.sql'),

    getEdgesNicheBio_BioRaster: sqlPath('niche/getNet/get_edges_bio_bioraster.sql'),
    getEdgesNicheRaster_BioRaster: sqlPath('niche/getNet/get_edges_raster_bioraster.sql'),

    getEdgesNicheBio_Bio: sqlPath('niche/getNet/get_edges_bio_bio.sql'),
    getEdgesNicheBio_Raster: sqlPath('niche/getNet/get_edges_bio_raster.sql'),
    getEdgesNicheRaster_Bio: sqlPath('niche/getNet/get_edges_raster_bio.sql'),
    getEdgesNicheRaster_Raster: sqlPath('niche/getNet/get_edges_raster_raster.sql')
  },
  getNodesNiche: {
    getNodesNicheBioRaster_BioRaster: sqlPath('niche/getNet/get_nodes.sql'),
    
    getNodesNicheBioRaster_Bio: sqlPath('niche/getNet/get_nodes_bioraster_bio.sql'),
    getNodesNicheBioRaster_Raster: sqlPath('niche/getNet/get_nodes_bioraster_raster.sql'),

    getNodesNicheBio_BioRaster: sqlPath('niche/getNet/get_nodes_bio_bioraster.sql'),
    getNodesNicheRaster_BioRaster: sqlPath('niche/getNet/get_nodes_raster_bioraster.sql'),

    getNodesNicheBio_Bio: sqlPath('niche/getNet/get_nodes_bio_bio.sql'),
    getNodesNicheBio_Raster: sqlPath('niche/getNet/get_nodes_bio_raster.sql'),
    getNodesNicheRaster_Bio: sqlPath('niche/getNet/get_nodes_raster_bio.sql'),
    getNodesNicheRaster_Raster: sqlPath('niche/getNet/get_nodes_raster_raster.sql')
  }
}

module.exports = queryProvider
