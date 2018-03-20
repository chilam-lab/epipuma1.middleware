/*
* @Author: Raul Sierra
* @Date:   2018-02-19 15:30:35
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-19 16:27:25
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


var possible_cases = [
						// quick test
						["true", "true","","","true","false", "true"], ["true", "true","apriori","","true","false", "true"], ["true", "true","","mapa_prob","true","false", "true"]

						// uncomment to test all possible cases
						// ["true", "true","","","true","true", "true"], ["true", "false","","","true","true", "true"], ["false", "true","","","true","true", "true"], // biotico - abiotico - sin apriori - con fosiles - con reg sin fecha - con rango
						// ["true", "true","","","true","true", "false"], ["true", "false","","","true","true", "false"], ["false", "true","","","true","true", "false"], // biotico - abiotico - sin apriori - con fosiles - con reg sin fecha - sin rango
						// ["true", "true","","","true","false", "true"], ["true", "false","","","true","false", "true"], ["false", "true","","","true","false", "true"], // biotico - abiotico - sin apriori - con fosiles - sin reg sin fecha - con rango
						// ["true", "true","","","true","false", "false"], ["true", "false","","","true","false", "false"], ["false", "true","","","true","false", "false"], // biotico - abiotico - sin apriori - con fosiles - sin reg sin fecha - sin rango


						// ["true", "true","","","false","true", "true"], ["true", "false","","","false","true", "true"], ["false", "true","","","false","true", "true"], // biotico - abiotico - sin apriori - sin fosiles - con reg sin fecha - con rango
						// ["true", "true","","","false","true", "false"], ["true", "false","","","false","true", "false"], ["false", "true","","","false","true", "false"], // biotico - abiotico - sin apriori - sin fosiles - con reg sin fecha - sin rango
						// ["true", "true","","","false","false", "true"], ["true", "false","","","false","false", "true"], ["false", "true","","","false","false", "true"], // biotico - abiotico - sin apriori - sin fosiles - sin reg sin fecha - con rango
						// ["true", "true","","","false","false", "false"], ["true", "false","","","false","false", "false"], ["false", "true","","","false","false", "false"], // biotico - abiotico - sin apriori - sin fosiles - sin reg sin fecha - sin rango

						
						// ["true", "true","apriori","","true","true", "true"], ["true", "false","apriori","","true","true", "true"], ["false", "true","apriori","","true","true", "true"], // biotico - abiotico - con apriori - con fosiles - con reg sin fecha - con rango
						// ["true", "true","apriori","","true","true", "false"], ["true", "false","apriori","","true","true", "false"], ["false", "true","apriori","","true","true", "false"], // biotico - abiotico - con apriori - con fosiles - con reg sin fecha - sin rango
						// ["true", "true","apriori","","true","false", "true"], ["true", "false","apriori","","true","false", "true"], ["false", "true","apriori","","true","false", "true"], // biotico - abiotico - con apriori - con fosiles - sin reg sin fecha - con rango
						// ["true", "true","apriori","","true","false", "false"], ["true", "false","apriori","","true","false", "false"], ["false", "true","apriori","","true","false", "false"], // biotico - abiotico - con apriori - con fosiles - sin reg sin fecha - sin rango


						// ["true", "true","apriori","","false","true", "true"], ["true", "false","apriori","","false","true", "true"], ["false", "true","apriori","","false","true", "true"], // biotico - abiotico - con apriori - sin fosiles - con reg sin fecha - con rango
						// ["true", "true","apriori","","false","true", "false"], ["true", "false","apriori","","false","true", "false"], ["false", "true","apriori","","false","true", "false"], // biotico - abiotico - con apriori - sin fosiles - con reg sin fecha - sin rango
						// ["true", "true","apriori","","false","false", "true"], ["true", "false","apriori","","false","false", "true"], ["false", "true","apriori","","false","false", "true"], // biotico - abiotico - con apriori - sin fosiles - sin reg sin fecha - con rango
						// ["true", "true","apriori","","false","false", "false"], ["true", "false","apriori","","false","false", "false"], ["false", "true","apriori","","false","false", "false"], // biotico - abiotico - con apriori - sin fosiles - sin reg sin fecha - sin rango


						// ["true", "true","","mapa_prob","true","true", "true"], ["true", "false","","mapa_prob","true","true", "true"], ["false", "true","","mapa_prob","true","true", "true"], // biotico - abiotico - con mapa_prob - con fosiles - con reg sin fecha - con rango
						// ["true", "true","","mapa_prob","true","true", "false"], ["true", "false","","mapa_prob","true","true", "false"], ["false", "true","","mapa_prob","true","true", "false"], // biotico - abiotico - con mapa_prob - con fosiles - con reg sin fecha - sin rango
						// ["true", "true","","mapa_prob","true","false", "true"], ["true", "false","","mapa_prob","true","false", "true"], ["false", "true","","mapa_prob","true","false", "true"], // biotico - abiotico - con mapa_prob - con fosiles - sin reg sin fecha - con rango
						// ["true", "true","","mapa_prob","true","false", "false"], ["true", "false","","mapa_prob","true","false", "false"], ["false", "true","","mapa_prob","true","false", "false"], // biotico - abiotico - con mapa_prob - con fosiles - sin reg sin fecha - sin rango


						// ["true", "true","","mapa_prob","false","true", "true"], ["true", "false","","mapa_prob","false","true", "true"], ["false", "true","","mapa_prob","false","true", "true"], // biotico - abiotico - con mapa_prob - sin fosiles - con reg sin fecha - con rango
						// ["true", "true","","mapa_prob","false","true", "false"], ["true", "false","","mapa_prob","false","true", "false"], ["false", "true","","mapa_prob","false","true", "false"], // biotico - abiotico - con mapa_prob - sin fosiles - con reg sin fecha - sin rango
						// ["true", "true","","mapa_prob","false","false", "true"], ["true", "false","","mapa_prob","false","false", "true"], ["false", "true","","mapa_prob","false","false", "true"], // biotico - abiotico - con mapa_prob - sin fosiles - sin reg sin fecha - con rango
						// ["true", "true","","mapa_prob","false","false", "false"], ["true", "false","","mapa_prob","false","false", "false"], ["false", "true","","mapa_prob","false","false", "false"] // con mapa_prob - sin fosiles - sin reg sin fecha - sin rango

					];

describe("\n========= Test for getScoreDecil functionality endpoint =========",function(){

	it("Should return a 200 response - getScoreDecil", function(done){

		supertest(server).post("/niche/getScoreDecil")
		.send({})
		.expect("Content-type",/json/)
		.expect(200, done);
	});


	it("Should respond with a listening message - getScoreDecil", function(done){

		supertest(server).post("/niche/getScoreDecil")
		.send({})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("message")
			expect(res.body).to.have.property("example")
			expect(res.body.message).to.equal("getScoreDecil endpoint listening, please add the minimum parameters to get a response. See the example parameter")
			done();
		})
	});

	it("Should respond with a example with the minimum parameters required - getScoreDecil", function(done){

		supertest(server).post("/niche/getScoreDecil")
		.send({})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res) {
			expect(res.body.example).to.have.property("id")
			expect(res.body.example).to.have.property("apriori")
			expect(res.body.example).to.have.property("min_occ")
			expect(res.body.example).to.have.property("fossil")
			expect(res.body.example).to.have.property("sfecha")
			expect(res.body.example).to.have.property("val_process")
			expect(res.body.example).to.have.property("idtabla")
			expect(res.body.example).to.have.property("grid_res")
			expect(res.body.example).to.have.property("tfilters")
			expect(res.body.example).to.have.property("hasBios")
			expect(res.body.example).to.have.property("hasRaster")
			expect(res.body.example).to.have.property("mapa_prob")
			expect(res.body.example).to.have.property("lim_inf")
			expect(res.body.example).to.have.property("lim_sup")
			done();
		})
	});

	possible_cases.forEach(params => {

		this.timeout(1000 * 60 * 3); // 3 minutos maximo
		var tfilters = [];
		var lim_inf = 1500
		var lim_sup = parseInt(moment().format('YYYY'));

		// agrega variable biotica
		if(params[0] === "true"){
			tfilters.push({
				field: "clasevalida",
				value: "Mammalia",
				type: 4
			});

		}

		// agrega variable abiotica
		if(params[1] === "true"){
			tfilters.push({
				value: "bio01",
				type: 0,
				level: 1,
				label: "Temperatura+media+anual"
			});

		}

		// con rango
		if(params[6] === "true"){
			lim_inf = 2000
		}
		
		it("Should get information about the result of a niche analysis grouped by decil. Params(hasBio, hasRaster, apriori, mapa_prob, fosil, sfecha, rango) => (" + params[0] + ", " + params[1] + ", " + params[2] + ", " + params[3] + ", " + params[4] + ", " + params[5] + ", " + params[6] + ")", function(done){
			supertest(server).post("/niche/getScoreDecil")
			.send({
				id: 27332,
				idtime: "1519077493248",
				apriori: params[2],
				min_occ: 1,
				fossil: params[4],
				sfecha: params[5],
				val_process: "false",
				idtabla: "no_table",
				grid_res: "16",
				tfilters: tfilters,
				hasBios: params[0],
				hasRaster: params[1],
				lim_inf: lim_inf,
				lim_sup: lim_sup
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, res){
				var length = res.body.data.length - 1
				var random_index = Math.floor(Math.random() * length) + 1

				expect(res.body).to.have.property("data")
				expect(res.body.data).all.have.property("decil")
				expect(res.body.data).all.have.property("l_sup")
				expect(res.body.data).all.have.property("l_inf")
				expect(res.body.data).all.have.property("avg")
				expect(res.body.data).all.have.property("arraynames")
				expect(res.body.data).all.have.property("vp")
				expect(res.body.data).all.have.property("fn")
				expect(res.body.data).all.have.property("nulos")
				expect(res.body.data).all.have.property("recall")

				// decil is always equal to 10
				// expect(res.body.data[0].decil).to.be.equal(10)
				done();
			})

		})


	});


})