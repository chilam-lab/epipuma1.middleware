/*
* @Author: Carlos Salazar
* @Date:   2018-02-22 18:30:35
* @Last Modified by:   Carlos Salazar
* @Last Modified time: 2018-02-23 16:17:25
*/

var supertest = require("supertest");
var should = require("should");
var expect = require('chai').expect;
var moment = require('moment')

var chai = require("chai");
// chai.should();
chai.use(require('chai-things'));

// var server = supertest.agent("http://localhost:8080");
var server

beforeEach(function () {
	delete require.cache[require.resolve('../../server')]
	server = require('../../server')
})

afterEach(function (done) {
	server.close(done)
})


describe("\n========= Test get species analysis endpoint =========",function(){

})


