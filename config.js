// Configuration file for middleware

var config = {};

config.db = {}; 
config.db.database = process.env.DBNAME || 'snib';
config.db.user     = process.env.DBUSER || 'demouser';
config.db.password = process.env.DBPWD || 'demopass';
config.db.host     = process.env.DBHOST || 'snib.conabio.gob.mx';
config.db.port     = process.env.DBPORT || '5434';
// Configure pool of connections
config.db.max      = 10;
config.db.idleTimeoutmillis = 30000;

module.exports = config;
