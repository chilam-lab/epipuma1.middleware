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
  specie: {
    getAll: sqlPath('specie/get_all.sql'),
    getByName: sqlPath('specie/get_by_name.sql'),
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
  }
}

module.exports = queryProvider
