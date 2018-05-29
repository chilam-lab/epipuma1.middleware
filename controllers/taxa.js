/*
* @Author: Raul Sierra
* @Date:   2017-11-28 15:51:19
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-12-01 11:29:31
*/
var debug = require('debug')('verbs:getChildrenTaxa')
var verb_utils = require('./verb_utils')

var queries = require('./sql/queryProvider')

var pool = verb_utils.pool 

function getHelloMessage(req, res, next) {
  res.json({'msg': 'taxa/children endpoint listening'})
}

exports.getTaxonData = function (req, res) {
  var spid = req.params.id

  if(spid) {
    pool.any(queries.getTaxon.getData, {
      'spid': spid
    })
			.then(function (data) {
  data[0]['tax_level'] = 'species'
  res.json(data[0])
})
			.catch(function (error) {
  console.log('error' + data)
  debug(error)
  next(error)
})
  }
  else {
    next()
  }
}

function getTaxonChildren(req, res, next) {
  var root_level = verb_utils.getParam(req, 'root_level')
  var root_name = verb_utils.getParam(req, 'root_name')
  var child_level = verb_utils.getParam(req, 'child_level')


  if(root_level) {
    pool.any(queries.getChildren.ofTaxon, {
      'root_level': root_level,
      'root_name': root_name,
      'child_level': child_level
    		})
			.then(function (data) {
  res.json({'data': data, 'root_level': root_level, 'root_name': root_name})
})
			.catch(function (error) {
  debug(error)
  next(error)
})
  }
  else {
    next()
  }
}

/**
 * Esta variable es un arreglo donde se define el flujo que debe de tener una 
 * petición al verbo getScoreDecilNiche. Actualmente el flujo es 
 * getScoreDecilNiche_A, getScoreDecilNiche_V, getScoreDecilNiche_T y 
 * getScoreDecilNiche.
 *
 * @see controllers/getChildrenTaxa
 */
exports.pipe = [
  getTaxonChildren,
  getHelloMessage
]