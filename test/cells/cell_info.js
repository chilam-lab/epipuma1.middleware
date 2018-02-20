/*
* @Author: Raul Sierra
* @Date:   2018-02-19 15:30:35
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-19 16:27:25
*/
var supertest = require("supertest");
var expect = require('chai').expect;

var chai = require("chai");
chai.should();
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

describe("Test get cell score info (getGridSpecies) endpoint",function(){
	it("Should return a 200 response", function(done){

		supertest(server).post("/niche/getGridSpecies")
		.send({})
		.expect("Content-type",/json/)
		.expect(200, done);
	});

	it("Should respond with a listening message", function(done){

		supertest(server).post("/niche/getGridSpecies")
		.send({})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("msg");
			expect(res.body.msg).to.equal("getGridSpecies endpoint listening")
			done();
		})
	});

	it("Should get score info for a one cell by coordinates", function(done){
		supertest(server).post("/niche/getGridSpecies")
		.send({
			qtype: "getGridSpecies",
			id: 27336,
			idreg: "Estados",
			idtime: 1519077493248,
			apriori: "apriori",
			min_occ: 50,
			fossil: false,
			sfecha: false,
			discardedDateFilterids: true,
			val_process: false,
			idtabla: "no_table",
			res_celda_sp: "cells_16km",
			res_celda_snib: "gridid_16km",
			res_celda_snib_tb: "grid_16km_aoi",
			tfilters: [{
				field: "clasevalida",
				value: "Mammalia",
				type: 4
			}],
			hasBios: true,
			hasRaster: false,
			lat: 29.42763722319321,
			long: -109.01184082031249
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("score_total")
			expect(res.body).to.have.property("score_apriori")
			expect(res.body).to.have.property("score_biotic")
			expect(res.body).to.have.property("score_abiotic")
			expect(res.body).to.have.property("data")
			done();
		})

	})
});
