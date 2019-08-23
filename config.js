// Configuration file for middleware
var config = {}


config.db = {}
/*config.db.database = process.env.DBNAME
config.db.user = process.env.DBUSER
config.db.password = process.env.DBPWD
config.db.host = process.env.DBHOST
config.db.port = process.env.DBPORT
config.db.application_name = 'expressMiddleware'
config.port = process.env.PORT*/
config.db.database = 'niche_integration'
config.db.user = 'funny_darwin'
config.db.password = 'y8$IYL0XKCW7'
config.db.host = '200.12.166.56'
config.db.port = 5432
config.db.application_name = 'expressMiddleware'
config.port = 8080


// Configure pool of connections
config.db.poolSize = 10

config.SEED = "@hardseedconabio2018";
config.TIME_TOKEN = 14400;

module.exports = config
