var QueryFile = require('pg-promise').QueryFile;
var path = require('path');

function sqlPath(file) {
  var fullPath = path.join(__dirname, file);
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
  }
};

module.exports = queryProvider;
