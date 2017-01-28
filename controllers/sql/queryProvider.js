var QueryFile = require('pg-promise').QueryFile
var path = require('path')

function sqlPath (file) {
  var fullPath = path.join(__dirname, file)
  return QueryFile(fullPath)
}

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
    getInfo: sqlPath('specie/get_info_specie.sql'),

    getGeoRel: sqlPath('specie/get_basic_geo_rel.sql'),
    getGeoRelBio: sqlPath('specie/get_basic_geo_rel_bio.sql'),
    getGeoRelRaster: sqlPath('specie/get_basic_geo_rel_raster.sql'),
    
    getGeoRelBioV: sqlPath('specie/get_geo_rel_BV.sql'),
    getGeoRelRasterV: sqlPath('specie/get_geo_rel_RaV.sql'),
    getGeoRelV: sqlPath('specie/get_geo_rel_V.sql'),

    getGeoRelBioT: sqlPath('specie/get_geo_rel_BT.sql'),
    getGeoRelRasterT: sqlPath('specie/get_geo_rel_RaT.sql'),
    getGeoRelT: sqlPath('specie/get_geo_rel_T.sql'),

    getGeoRelBioVT: sqlPath('specie/get_geo_rel_BVT.sql'),
    getGeoRelVT: sqlPath('specie/get_geo_rel_TVT.sql'),
    getGeoRelRaVT: sqlPath('specie/get_geo_rel_RaVT.sql')

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

    getFreqMapBioM: sqlPath('getFreqMap/get_freq_map_BM.sql')
    // getFreqMapRaM: sqlPath('getFreqMap/get_freq_map_RaM.sql'),
    // getFreqMapM: sqlPath('getFreqMap/get_freq_map_M.sql')

  },

  getScoreDecil: {

    getScoreDecilBio: sqlPath('getFreqMap/get_basic_score_decil_bio.sql')

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
  }


}

module.exports = queryProvider
