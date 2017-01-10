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
    getFreqT: sqlPath('getFreq/get_freq_T.sql')

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
