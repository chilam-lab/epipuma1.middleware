// Configuration file for middleware
var config = {}


config.db = {}
config.db.database = process.env.DBNAME
config.db.user = process.env.DBUSER
config.db.password = process.env.DBPWD
config.db.host = process.env.DBHOST
config.db.port = process.env.DBPORT
config.db.application_name = 'expressMiddleware'
 
// Configure pool of connections
config.db.poolSize = 10

//Configure API port
config.port = process.env.PORT

//TODO: Migrar al archivo de entorno
config.SEED = "@hardseedconabio2018";
config.TIME_TOKEN = 14400;

module.exports = config
