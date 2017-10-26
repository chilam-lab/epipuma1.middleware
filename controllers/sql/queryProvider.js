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
  specie: {
    getAll: sqlPath('specie/get_all.sql'),
    getByName: sqlPath('specie/get_specie_by_name.sql'),
    getFieldByName: sqlPath('specie/get_group_by_name.sql'),
    getInfo: sqlPath('specie/get_info_specie.sql')
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


  users: {
    getUser: sqlPath('users/getUserReg.sql')
  },
  getValuesFromToken: {
    getValues: sqlPath('especie/get_values_token.sql')
  },
  getToken: {
    setLinkValues: sqlPath('especie/set_link_values.sql')
  },
  getValidationTables: {
    createTables: sqlPath('especie/get_validation_tables.sql')
  },
  processValidationTables: {
    processTables: sqlPath('especie/process_validation_tables.sql')
  },
  deleteValidationTables: {
    deleteTables: sqlPath('especie/delete_validation_tables.sql')
  },
  getVariablesNiche: {
    getVariablesReino: sqlPath('especie/get_variables_reino.sql'),
    getVariables: sqlPath('especie/get_variables.sql')
  },
  getRasterNiche: {
    getRasterBios: sqlPath('raster/raster_bios.sql'),
    getRasterIds: sqlPath('raster/raster_ids.sql')
  },
  getSpeciesNiche: {
    getSpecies: sqlPath('especie/getSpecies.sql'),
    getSpeciesSD: sqlPath('especie/getSpecies_sdate.sql'),
    getSpeciesR: sqlPath('especie/getSpecies_range.sql'),
    getSpeciesSDR: sqlPath('especie/getSpecies_sdr.sql')
  },
  getEntListNiche: {
    getEntList: sqlPath('especie/getEntList.sql')
  },
  getGrididsNiche: {
    getGridids: sqlPath('especie/getGridids.sql')
  },
  getCountGridid: {
    getCount: sqlPath('especie/getCountGridid.sql')
  },

  /************************************************************* VERBOS PARA NICHO ******************************/
  getGridSpeciesNiche: {
    getGridSpeciesBio: sqlPath('getGridSpecies/get_grid_species_bio.sql'),
    getGridSpeciesRaster: sqlPath('getGridSpecies/get_grid_species_raster.sql'),
    getGridSpecies: sqlPath('getGridSpecies/get_grid_species.sql'),

    getGridSpeciesBioT: sqlPath('getGridSpecies/get_grid_species_BT.sql'),
    getGridSpeciesRaT: sqlPath('getGridSpecies/get_grid_species_RaT.sql'),
    getGridSpeciesT: sqlPath('getGridSpecies/get_grid_species_T.sql'),

    getGridSpeciesBioA: sqlPath('getGridSpecies/get_grid_species_BA.sql'),
    getGridSpeciesRaA: sqlPath('getGridSpecies/get_grid_species_RaA.sql'),
    getGridSpeciesA: sqlPath('getGridSpecies/get_grid_species_A.sql'),

    getGridSpeciesBioM: sqlPath('getGridSpecies/get_grid_species_BM.sql'),
    getGridSpeciesRaM: sqlPath('getGridSpecies/get_grid_species_RaM.sql'),
    getGridSpeciesM: sqlPath('getGridSpecies/get_grid_species_M.sql')
  },
  getGeoRelNiche: {
    getGeoRel: sqlPath('getGeoRel/get_geo_rel.sql'),
    getGeoRelBio: sqlPath('getGeoRel/get_geo_rel_bio.sql'),
    getGeoRelRaster: sqlPath('getGeoRel/get_geo_rel_raster.sql'),
    
    getGeoRelBioV: sqlPath('getGeoRel/get_geo_rel_BV.sql'),
    getGeoRelRaV: sqlPath('getGeoRel/get_geo_rel_RaV.sql'),
    getGeoRelV: sqlPath('getGeoRel/get_geo_rel_V.sql'),

    getGeoRelBioT: sqlPath('getGeoRel/get_geo_rel_BT.sql'),
    getGeoRelRaT: sqlPath('getGeoRel/get_geo_rel_RaT.sql'),
    getGeoRelT: sqlPath('getGeoRel/get_geo_rel_T.sql'),

    getGeoRelBioVT: sqlPath('getGeoRel/get_geo_rel_BVT.sql'),
    getGeoRelVT: sqlPath('getGeoRel/get_geo_rel_VT.sql'),
    getGeoRelRaVT: sqlPath('getGeoRel/get_geo_rel_RaVT.sql')
  },
  getFreqNiche: {
    getFreqBio: sqlPath('getFreq/get_freq_bio.sql'),
    getFreqRaster: sqlPath('getFreq/get_freq_raster.sql'),
    getFreq: sqlPath('getFreq/get_freq.sql'),

    getFreqBioV: sqlPath('getFreq/get_freq_BV.sql'),
    getFreqRasterV: sqlPath('getFreq/get_freq_RaV.sql'),
    getFreqV: sqlPath('getFreq/get_freq_V.sql'),

    getFreqBioT: sqlPath('getFreq/get_freq_BT.sql'),
    getFreqRasterT: sqlPath('getFreq/get_freq_RaT.sql'),
    getFreqT: sqlPath('getFreq/get_freq_T.sql'),

    getFreqBioVT: sqlPath('getFreq/get_freq_BVT.sql'),
    getFreqRaVT: sqlPath('getFreq/get_freq_RaVT.sql'),
    getFreqVT: sqlPath('getFreq/get_freq_VT.sql')
  },

  getFreqMapNiche: {
    getFreqMapBio: sqlPath('getCellScore/get_freq_map_bio.sql'),
    getFreqMapRaster: sqlPath('getCellScore/get_freq_map_raster.sql'),
    getFreqMap: sqlPath('getCellScore/get_freq_map.sql'),

    getFreqMapBioT: sqlPath('getCellScore/get_freq_map_BT.sql'),
    getFreqMapRaT: sqlPath('getCellScore/get_freq_map_RaT.sql'),
    getFreqMapT: sqlPath('getCellScore/get_freq_map_T.sql'),

    getFreqMapBioA: sqlPath('getCellScore/get_freq_map_BA.sql'),
    getFreqMapRaA: sqlPath('getCellScore/get_freq_map_RaA.sql'),
    getFreqMapA: sqlPath('getCellScore/get_freq_map_A.sql'),

    getFreqMapBioM: sqlPath('getCellScore/get_freq_map_BM.sql'),
    getFreqMapRaM: sqlPath('getCellScore/get_freq_map_RaM.sql'),
    getFreqMapM: sqlPath('getCellScore/get_freq_map_M.sql')

    // getFreqMapBioTA: sqlPath('getCellScore/get_freq_map_BTA.sql'),
    // getFreqMapRaTA: sqlPath('getCellScore/get_freq_map_RaTA.sql'),
    // getFreqMapTA: sqlPath('getCellScore/get_freq_map_TA.sql'),

    // getFreqMapBioTM: sqlPath('getCellScore/get_freq_map_BTM.sql'),
    // getFreqMapRaTM: sqlPath('getCellScore/get_freq_map_RaTM.sql'),
    // getFreqMapTM: sqlPath('getCellScore/get_freq_map_TM.sql')
  },
  getFreqCeldaNiche: {
    getFreqCeldaBio: sqlPath('getFreqCelda/get_freq_celda_bio.sql'),
    getFreqCeldaRaster: sqlPath('getFreqCelda/get_freq_celda_raster.sql'),
    getFreqCelda: sqlPath('getFreqCelda/get_freq_celda.sql'),

    getFreqCeldaBioT: sqlPath('getFreqCelda/get_freq_celda_BT.sql'),
    getFreqCeldaRaT: sqlPath('getFreqCelda/get_freq_celda_RaT.sql'),
    getFreqCeldaT: sqlPath('getFreqCelda/get_freq_celda_T.sql'),

    getFreqCeldaBioV: sqlPath('getFreqCelda/get_freq_celda_BV.sql'),
    getFreqCeldaRaV: sqlPath('getFreqCelda/get_freq_celda_RaV.sql'),
    getFreqCeldaV: sqlPath('getFreqCelda/get_freq_celda_V.sql'),

    getFreqCeldaBioA: sqlPath('getFreqCelda/get_freq_celda_BA.sql'),
    getFreqCeldaRaA: sqlPath('getFreqCelda/get_freq_celda_RaA.sql'),
    getFreqCeldaA: sqlPath('getFreqCelda/get_freq_celda_A.sql')

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
    getScoreDecilBio: sqlPath('getScoreDecil/get_score_decil_bio.sql'),

    getScoreDecilRaster: sqlPath('getScoreDecil/get_score_decil_raster.sql'),
    getScoreDecil: sqlPath('getScoreDecil/get_score_decil.sql'),

    getScoreDecilBioT: sqlPath('getScoreDecil/get_score_decil_BT.sql'),
    getScoreDecilRaT: sqlPath('getScoreDecil/get_score_decil_RaT.sql'),
    getScoreDecilT: sqlPath('getScoreDecil/get_score_decil_T.sql'),

    getScoreDecilBioV: sqlPath('getScoreDecil/get_score_decil_BV.sql'),
    getScoreDecilRaV: sqlPath('getScoreDecil/get_score_decil_RaV.sql'),
    getScoreDecilV: sqlPath('getScoreDecil/get_score_decil_V.sql'),

    getScoreDecilBioA: sqlPath('getScoreDecil/get_score_decil_BA.sql'),
    getScoreDecilRaA: sqlPath('getScoreDecil/get_score_decil_RaA.sql'),
    getScoreDecilA: sqlPath('getScoreDecil/get_score_decil_A.sql')

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
    // getEdgesNicheBio: sqlPath('getNet/get_edges_bio.sql'),
    // getEdgesNicheRaster: sqlPath('getNet/get_edges_raster.sql'),
    // getEdgesNiche: sqlPath('getNet/get_edges.sql')

    getEdgesNicheBioRaster_BioRaster: sqlPath('getNet/get_edges.sql'),
    
    getEdgesNicheBioRaster_Bio: sqlPath('getNet/get_edges_bioraster_bio.sql'),
    getEdgesNicheBioRaster_Raster: sqlPath('getNet/get_edges_bioraster_raster.sql'),

    getEdgesNicheBio_BioRaster: sqlPath('getNet/get_edges_bio_bioraster.sql'),
    getEdgesNicheRaster_BioRaster: sqlPath('getNet/get_edges_raster_bioraster.sql'),

    getEdgesNicheBio_Bio: sqlPath('getNet/get_edges_bio_bio.sql'),
    getEdgesNicheBio_Raster: sqlPath('getNet/get_edges_bio_raster.sql'),
    getEdgesNicheRaster_Bio: sqlPath('getNet/get_edges_raster_bio.sql'),
    getEdgesNicheRaster_Raster: sqlPath('getNet/get_edges_raster_raster.sql')
  },
  getNodesNiche: {
    getNodesNicheBioRaster_BioRaster: sqlPath('getNet/get_nodes.sql'),
    
    getNodesNicheBioRaster_Bio: sqlPath('getNet/get_nodes_bioraster_bio.sql'),
    getNodesNicheBioRaster_Raster: sqlPath('getNet/get_nodes_bioraster_raster.sql'),

    getNodesNicheBio_BioRaster: sqlPath('getNet/get_nodes_bio_bioraster.sql'),
    getNodesNicheRaster_BioRaster: sqlPath('getNet/get_nodes_raster_bioraster.sql'),

    getNodesNicheBio_Bio: sqlPath('getNet/get_nodes_bio_bio.sql'),
    getNodesNicheBio_Raster: sqlPath('getNet/get_nodes_bio_raster.sql'),
    getNodesNicheRaster_Bio: sqlPath('getNet/get_nodes_raster_bio.sql'),
    getNodesNicheRaster_Raster: sqlPath('getNet/get_nodes_raster_raster.sql')
  },

/************************************************************* VERBOS PARA OBTENER INFO de CELDAS ******************************/
  getCells: {
    forSpecies: sqlPath('getCells/get_species_cells.sql'),
    forTaxon: sqlPath('getCells/get_taxon_cells.sql')
  }
}

module.exports = queryProvider
