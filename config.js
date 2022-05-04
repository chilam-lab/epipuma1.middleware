// Configuration file for middleware
var config = {}


config.db = {}
config.db.database = 'niche_candidate'
config.db.user = 'postgres'
config.db.password = '!37JzLg+9M2RAu72'
config.db.host = '10.90.0.38'
config.db.port = 5433
config.db.application_name = 'expressMiddleware'
config.port = 8081
config.email = {}
config.email.user = process.env.EUSER
config.email.pass = process.env.EPASS
config.email.host = process.env.EHOST
config.email.port = process.env.EPORT


// Configure pool of connections
config.db.poolSize = 10

config.SEED = "@hardseedconabio2018";
config.TIME_TOKEN = 14400;

module.exports = config


