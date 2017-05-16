// Configuration file for middleware

var config = {}

config.db = {}
config.db.database = process.env.DBNAME || 'snib'
config.db.user = process.env.DBUSER || 'demouser'
config.db.password = process.env.DBPWD || 'demopass'
config.db.host = process.env.DBHOST || 'snib.conabio.gob.mx'
config.db.port = process.env.DBPORT || '5434'
config.db.application_name = 'expressMiddleware'
 
// Configure pool of connections

config.db.poolSize = 10

module.exports = config
