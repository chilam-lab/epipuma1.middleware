/**
* Módulo que es responsable proveer las consultas que utilizan los verbos. 
*
* @exports controllers/sql/queryProvider
* @requires pg-promise.QueryFile
* @requires path
*/
var QueryFile = require('pg-promise').QueryFile
var path = require('path')
var fs = require('fs')

function sqlPath (file) {
  var fullPath = path.join(__dirname, file)
  return QueryFile(fullPath)
}

function tmplPath (file) {
  var fullPath = path.join(__dirname, file)
  return fs.readFileSync(fullPath)
}

/* 
 * Objeto que provee las consultas para los verbos
 */
var queryProvider = {
  grid: {
    gridxxkm: sqlPath('grids/grid_xxkm.sql') 
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

    getGridSpeciesBioA: sqlPath('getUtilGeoportal/get_grid_species_BA.sql'),
    getGridSpeciesRaA: sqlPath('getUtilGeoportal/get_grid_species_RaA.sql'),
    getGridSpeciesA: sqlPath('getUtilGeoportal/get_grid_species_A.sql'),

    getGridSpeciesBioM: sqlPath('getUtilGeoportal/get_grid_species_BM.sql'),
    getGridSpeciesRaM: sqlPath('getUtilGeoportal/get_grid_species_RaM.sql'),
    getGridSpeciesM: sqlPath('getUtilGeoportal/get_grid_species_M.sql')

  },


/**************************************************************************************************************************/
/**************************************************************************************************************************/
/**************************************************************************************************************************/
/************************************************************* VERBOS PARA EL NUEVO SERVIDOR ******************************/


/************************************************************* VERBOS ÚTILES ******************************/


  users: {
    getUser: sqlPath('users/getUserReg.sql'),
    setUserReg: sqlPath('users/setUserReg.sql'),
    saveFeedBack: sqlPath('users/saveFeedBack.sql')
  },
  getValuesFromToken: {
    getValues: sqlPath('especie/get_values_token.sql')
  },
  getToken: {
    setLinkValues: sqlPath('especie/set_link_values.sql')
  },
  getValidationTables: {
    createTables: sqlPath('especie/get_validation_tables.sql'),
    createGroupTables: sqlPath('especie/get_group_validation_tables.sql'),
    createGroupTables_2: sqlPath('especie/get_group_validation_tables_2.sql')
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
    getRasterAvailableVariables: sqlPath('raster/raster_available_variables.sql'),
    getRasterVariableSelected: sqlPath('raster/raster_variable_selected.sql'),
    getRasterVariableById: sqlPath('raster/raster_variable_by_id.sql'),
    getAvailableVariables: sqlPath('raster/available_variables.sql')
    
    
  },
  getSpeciesNiche: {
    getSpecies: sqlPath('especie/getSpecies.sql'),
    getSpeciesArray: sqlPath('especie/getSpeciesArray.sql'),
    getSpeciesSD: sqlPath('especie/getSpecies_sdate.sql'),
    getSpeciesArraySD: sqlPath('especie/getSpeciesArray_sdate.sql'),
    getSpeciesR: sqlPath('especie/getSpecies_range.sql'),
    getSpeciesArrayR: sqlPath('especie/getSpeciesArray_range.sql'),
    getSpeciesSDR: sqlPath('especie/getSpecies_sdr.sql'),
    getSpeciesArraySDR: sqlPath('especie/getSpeciesArray_sdr.sql'),
    
    getSpeciesTaxonArray: sqlPath('especie/getSpeciesTaxonArray.sql'),
    getSpeciesTaxonArraySD: sqlPath('especie/getSpeciesTaxonArray_sdate.sql'),
    getSpeciesTaxonArrayR: sqlPath('especie/getSpeciesTaxonArray_range.sql'),
    getSpeciesTaxonArraySDR: sqlPath('especie/getSpeciesTaxonArray_sdr.sql')
    

  },
  getEntListNiche: {
    getEntList: sqlPath('especie/getEntList.sql'),
    getEntListByTaxon: sqlPath('especie/getEntListByTaxon.sql')
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

    getGridSpeciesBioA: sqlPath('getGridSpecies/get_grid_species_BA.sql'),
    getGridSpeciesRaA: sqlPath('getGridSpecies/get_grid_species_RaA.sql'),
    getGridSpeciesA: sqlPath('getGridSpecies/get_grid_species_A.sql'),

    getGridSpeciesBioM: sqlPath('getGridSpecies/get_grid_species_BM.sql'),
    getGridSpeciesRaM: sqlPath('getGridSpecies/get_grid_species_RaM.sql'),
    getGridSpeciesM: sqlPath('getGridSpecies/get_grid_species_M.sql'),

    getTargetCells: sqlPath('getGridSpecies/get_target_cells.sql'),
    getGridSpeciesTaxons: sqlPath('especie/get_grid_species_taxons.sql')

  },
  getGeoRelNiche: {
    getGeoRel: sqlPath('getGeoRel/get_geo_rel.sql'),
    getGeoRelBio: sqlPath('getGeoRel/get_geo_rel_bio.sql'),
    getGeoRelRaster: sqlPath('getGeoRel/get_geo_rel_raster.sql'),
    getBioScores: sqlPath('getGeoRel/get_bio_scores.sql')
  },
  getFreqNiche: {
    getFreqBio: sqlPath('getFreq/get_freq_bio.sql'),
    getFreqRaster: sqlPath('getFreq/get_freq_raster.sql'),
    getFreq: sqlPath('getFreq/get_freq.sql')

  },

  getFreqMapNiche: {
    getFreqMapBio: sqlPath('getCellScore/get_freq_map_bio.sql'),
    getFreqMapRaster: sqlPath('getCellScore/get_freq_map_raster.sql'),
    getFreqMap: sqlPath('getCellScore/get_freq_map.sql'),

    getFreqMapBioA: sqlPath('getCellScore/get_freq_map_BA.sql'),
    getFreqMapRaA: sqlPath('getCellScore/get_freq_map_RaA.sql'),
    getFreqMapA: sqlPath('getCellScore/get_freq_map_A.sql'),

    getFreqMapBioM: sqlPath('getCellScore/get_freq_map_BM.sql'),
    getFreqMapRaM: sqlPath('getCellScore/get_freq_map_RaM.sql'),
    getFreqMapM: sqlPath('getCellScore/get_freq_map_M.sql')

  },
  getFreqCeldaNiche: {
    getFreqCeldaBio: sqlPath('getFreqCelda/get_freq_celda_bio.sql'),
    getFreqCeldaRaster: sqlPath('getFreqCelda/get_freq_celda_raster.sql'),
    getFreqCelda: sqlPath('getFreqCelda/get_freq_celda.sql'),

    getFreqCeldaBioA: sqlPath('getFreqCelda/get_freq_celda_BA.sql'),
    getFreqCeldaRaA: sqlPath('getFreqCelda/get_freq_celda_RaA.sql'),
    getFreqCeldaA: sqlPath('getFreqCelda/get_freq_celda_A.sql')

   
  },
  getScoreDecilNiche: {
    getScoreDecilBio: sqlPath('getScoreDecil/get_score_decil_bio.sql'),
    getScoreDecilRaster: sqlPath('getScoreDecil/get_score_decil_raster.sql'),
    getScoreDecil: sqlPath('getScoreDecil/get_score_decil.sql'),

    getScoreDecilBioA: sqlPath('getScoreDecil/get_score_decil_BA.sql'),
    getScoreDecilRaA: sqlPath('getScoreDecil/get_score_decil_RaA.sql'),
    getScoreDecilA: sqlPath('getScoreDecil/get_score_decil_A.sql')

  
  },

  basicAnalysis:{
    getN: sqlPath("basic-analysis/get-n.sql"),
    getAllGridId: sqlPath("basic-analysis/get-all-gridids.sql"),
    getGridIdByLatLong: sqlPath("basic-analysis/getGridIdByLatLong.sql"),

    getCountsBio: sqlPath("basic-analysis/get-counts-bio.sql"),
    getCountsBioFossil: sqlPath("basic-analysis/get-counts-bio-fossil.sql"),
    getCountsBioTime: sqlPath("basic-analysis/get-counts-bio-time.sql"),

    getCountsAbio: sqlPath("basic-analysis/get-counts-abio.sql"),
    // para variables climaticas no hay tiempo ni fosil, solo cambia el source de la tabla sp_snib a snib
    getCountsAbioFossilTime: sqlPath("basic-analysis/get-counts-abio-fossil-time.sql"),     
    
    getCounts: sqlPath("basic-analysis/get-counts.sql"),
    getCountsFossil: sqlPath("basic-analysis/get-counts-fossil.sql"),
    getCountsTime: sqlPath("basic-analysis/get-counts-time.sql"),

    getCountsGroupBio: sqlPath("basic-analysis/get-counts-group-bio.sql"),
    getCountByYear: sqlPath("especie/get-count-by-year.sql"),
    getCellOcurrences: sqlPath("especie/get-cell-ocurrences.sql")

    // getSource: sqlPath("basic-analysis/get-source.sql"),
    // getSourceFossil: sqlPath("basic-analysis/get-source-fossil.sql"),
    // getSourceTime: sqlPath("basic-analysis/get-source-time.sql"),

    // getTarget: sqlPath("basic-analysis/get-target.sql"),
    // getTargetFossil: sqlPath("basic-analysis/get-target-fossil.sql"),
    // getTargetTime: sqlPath("basic-analysis/get-target-time.sql"),

    // getTarget: sqlPath("basic-analysis/get-target-ba.sql"),
    // getTargetFossil: sqlPath("basic-analysis/get-target-fossil-ba.sql"),
    // getTargetTime: sqlPath("basic-analysis/get-target-time-ba.sql")
  },

/************************************************************* VERBOS PARA REDES ******************************/

  getEdgesNiche: {
    
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
    forTaxon: sqlPath('getCells/get_taxon_cells.sql'),
    fromCoordinates: sqlPath('getCells/get_gridid_from_coordinates.sql')
  },

  getSpecies: {
    forCell: sqlPath('getSpecies/get_cell_species.sql')
  },
  
/************************************************************* VERBOS PARA OBTENER INFO DE TAXA ******************************/
  getChildren: {
    ofTaxon: sqlPath('taxa/get_taxon_children.sql')
  },
  getTaxon: {
    getData: sqlPath('taxa/get_taxon_data.sql')
  }, 

/************************************************************* VERBOS PARA OBTENER INFO DE TAXA ******************************/
  getGridScores: {
    forSpecies: sqlPath('getGridScores/get_grid_scores.sql')
  },

  subaoi: {
    getSubAOI: sqlPath('sub-aoi/get-sub-aoi.sql'), 
    getAvailableCountries: sqlPath('sub-aoi/get-available-countries.sql'),
    getAvailableCountriesFootprint: sqlPath('sub-aoi/get-available-countries-footprint.sql'),
    getCountriesRegion: sqlPath('sub-aoi/get-countries-region.sql')

    
  },
  
  apiUtils: {
    getIdFromName: sqlPath("especie/getIdFromName.sql")

  },

  validationProcess: {
    getSourceCells: sqlPath("getCells/get_source_cells_vp.sql"),
    getTotalCells: sqlPath("getCells/get_total_cells_vp.sql")

  },

  countsTaxonGroups: {
    targetGroup: sqlPath("taxons-group/get-counts-target.sql"),
    covarBioGroup: tmplPath("taxons-group/get-counts-covar-bio.tmpl"),
    covarAbioGroup: tmplPath("taxons-group/get-counts-covar-abio.tmpl"),
    getCountsBase: sqlPath("taxons-group/get-counts-base.sql"),
    getCountsCovars: tmplPath("taxons-group/get-counts-covars.tmpl"),
    getCellsByGroupBio: tmplPath("taxons-group/get-cells-group-bio.tmpl"),
    getCellsByGroupAbio: tmplPath("taxons-group/get-cells-group-abio.tmpl"),
    getCellSincePoint: sqlPath("taxons-group/get-cell-since-point.sql")
  },

  taxonsGroupNodes:{
    getNodesBase: sqlPath("nodes-taxons-group/get-nodes-base.sql"),
    nodesSource: tmplPath("nodes-taxons-group/nodes-source.tmpl"),
    nodesBio: tmplPath("nodes-taxons-group/nodes-bio.tmpl"),
    nodesAbio: tmplPath("nodes-taxons-group/nodes-abio.tmpl"),
    getEdgesBase: sqlPath("nodes-taxons-group/get-edges-base.sql"),
    covarBio: tmplPath("nodes-taxons-group/covar-bio.tmpl"),
    covarAbio: tmplPath("nodes-taxons-group/covar-abio.tmpl"),
    selectNodes : tmplPath("nodes-taxons-group/select-nodes.tmpl"),
    getGroupCount: sqlPath("nodes-taxons-group/get-group-count-grid-id.sql"),
    getCellsBio: tmplPath("nodes-taxons-group/get-cells-bio.tmpl"),
    getCellsAbio: tmplPath("nodes-taxons-group/get-cells-abio.tmpl"),
    selectCount: tmplPath("nodes-taxons-group/select-count.tmpl")

  },

}

module.exports = queryProvider
