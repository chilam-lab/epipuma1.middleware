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



var possible_cases = [
						
						["true", "false","true","true", "true"]
						// uncomment to test all possible biotic cases
						// ,["true", "true","true","true", "true"], // bioticos - abioticos - con fosiles - con reg sin fecha - con rango
						// ["true", "true","true","true", "false"], ["true", "false","true","true", "false"], // bioticos - abioticos - con fosiles - con reg sin fecha - sin rango
						// ["true", "true","true","false", "true"], ["true", "false","true","false", "true"], // bioticos - abioticos - con fosiles - sin reg sin fecha - con rango
						// ["true", "true","true","false", "false"], ["true", "false","true","false", "false"], // bioticos - abioticos - con fosiles - sin reg sin fecha - sin rango


						// ["true", "true","false","true", "true"], ["true", "false","false","true", "true"], // bioticos - abioticos - sin fosiles - con reg sin fecha - con rango
						// ["true", "true","false","true", "false"], ["true", "false","false","true", "false"], // bioticos - abioticos - sin fosiles - con reg sin fecha - sin rango
						// ["true", "true","false","false", "true"], ["true", "false","false","false", "true"], // bioticos - abioticos - sin fosiles - sin reg sin fecha - con rango
						// ["true", "true","false","false", "false"], ["true", "false","false","false", "false"], // bioticos - abioticos - sin fosiles - sin reg sin fecha - sin rango

					];


it("Should return a 200 response", function(done){

	supertest(server).post("/niche/getGeoRel")
	.send({})
	.expect("Content-type",/json/)
	.expect(200, done);
});


it("Should respond with a listening message", function(done){

	supertest(server).post("/niche/getGeoRel")
	.send({})
	.expect("Content-type",/json/)
	.expect(200)
	.end(function(err, res) {
		expect(res.body).to.have.property("message")
		expect(res.body).to.have.property("example")
		expect(res.body.message).to.equal("getGeoRel endpoint listening, please add the minimum parameters to get a response. See the example parameter")
		done();
	})
});

it("Should respond with a example with the minimum parameters required - getGeoRel", function(done){

	supertest(server).post("/niche/getGeoRel")
	.send({})
	.expect("Content-type",/json/)
	.expect(200)
	.end(function(err, res) {
		expect(res.body.example).to.have.property("id")
		expect(res.body.example).to.have.property("fossil")
		expect(res.body.example).to.have.property("sfecha")
		expect(res.body.example).to.have.property("val_process")
		expect(res.body.example).to.have.property("idtabla")
		expect(res.body.example).to.have.property("grid_res")
		expect(res.body.example).to.have.property("tfilters")
		expect(res.body.example).to.have.property("hasBios")
		expect(res.body.example).to.have.property("hasRaster")
		done();
	})
});

possible_cases.forEach(params => {

	describe("Test get niche analysis (getGeoRel) endpoint - params(hasBio, hasRaster, fosil, sfecha, rango) => (" + params[0] + ", " + params[1] + ", " + params[2] + ", " + params[3] + ", " + params[4] + ")",function(){

		this.timeout(1000 * 60 * 3); // bioticos - abioticos - 3 minutos maximo
		var tfilters = [];
		var lim_inf = 1500
		var lim_sup = parseInt(moment().format('YYYY'));

		// bioticos - abioticos - agrega variable biotica
		if(params[0] === "true"){
			tfilters.push({
				field: "clasevalida",
				value: "Mammalia",
				type: 4
			});

		}

		// bioticos - abioticos - agrega variable abiotica
		if(params[1] === "true"){
			tfilters.push({
				value: "bio01",
				type: 0,
				level: 1,
				label: "Temperatura+media+anual"
			});

		}

		// bioticos - abioticos - con rango
		if(params[4] === "true"){
			lim_inf = 2000
		}
		
		it("Should get information about the result of a niche analysis such as ni, nj, nij, n, epsilon, score and so on.", function(done){
			supertest(server).post("/niche/getGeoRel")
			.send({
				id: 27332,
				idtime: "1519077493248",
				min_occ: 1,
				fossil: params[2],
				sfecha: params[3],
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
				// console.log("random_index: " + random_index);

				expect(res.body).to.have.property("data")
				expect(res.body.data).all.have.property("n")
				expect(res.body.data).all.have.property("ni")
				expect(res.body.data).all.have.property("nj")
				expect(res.body.data).all.have.property("nij")
				expect(res.body.data).all.have.property("especievalidabusqueda")
				expect(res.body.data).all.have.property("reinovalido")
				expect(res.body.data).all.have.property("phylumdivisionvalido")
				expect(res.body.data).all.have.property("clasevalida")
				expect(res.body.data).all.have.property("ordenvalido")
				expect(res.body.data).all.have.property("familiavalida")
				expect(res.body.data).all.have.property("epsilon")
				expect(res.body.data).all.have.property("score")
				// especievalidabusqueda is always equal or greater than nij
				expect(res.body.data[random_index].especievalidabusqueda).not.to.be.empty;
				expect(res.body.data[random_index].reinovalido).not.to.be.empty;
				expect(res.body.data[random_index].phylumdivisionvalido).not.to.be.empty;
				expect(res.body.data[random_index].clasevalida).not.to.be.empty;
				expect(res.body.data[random_index].ordenvalido).not.to.be.empty;
				expect(res.body.data[random_index].familiavalida).not.to.be.empty;
				// ni is always equal or greater than nij
				expect(parseInt(res.body.data[random_index].ni)).to.be.at.least(parseInt(res.body.data[random_index].nij))
				// ni is always equal or greater than 0
				expect(parseInt(res.body.data[random_index].ni)).to.be.at.least(0)
				// nj is always equal or greater than 0
				expect(parseInt(res.body.data[random_index].nj)).to.be.at.least(0)
				
				done();
			})

		})

	})

});



it("Should return a 200 response", function(done){

	supertest(server).post("/niche/getFreq")
	.send({})
	.expect("Content-type",/json/)
	.expect(200, done);
});


it("Should respond with a listening message", function(done){

	supertest(server).post("/niche/getFreq")
	.send({})
	.expect("Content-type",/json/)
	.expect(200)
	.end(function(err, res) {
		expect(res.body).to.have.property("message")
		expect(res.body).to.have.property("example")
		expect(res.body.message).to.equal("getFreq endpoint listening, please add the minimum parameters to get a response. See the example parameter")
		done();
	})
});

it("Should respond with a example with the minimum parameters required - getFreq", function(done){

	supertest(server).post("/niche/getFreq")
	.send({})
	.expect("Content-type",/json/)
	.expect(200)
	.end(function(err, res) {
		expect(res.body.example).to.have.property("id")
		expect(res.body.example).to.have.property("fossil")
		expect(res.body.example).to.have.property("sfecha")
		expect(res.body.example).to.have.property("val_process")
		expect(res.body.example).to.have.property("idtabla")
		expect(res.body.example).to.have.property("grid_res")
		expect(res.body.example).to.have.property("tfilters")
		expect(res.body.example).to.have.property("hasBios")
		expect(res.body.example).to.have.property("hasRaster")
		done();
	})
});

possible_cases.forEach(params => {

	describe("Test get niche analysis (getFreq) endpoint - params(hasBio, hasRaster, fosil, sfecha, rango) => (" + params[0] + ", " + params[1] + ", " + params[2] + ", " + params[3] + ", " + params[4] + ")",function(){

		this.timeout(1000 * 60 * 3); // bioticos - abioticos - 3 minutos maximo
		var tfilters = [];
		var lim_inf = 1500
		var lim_sup = parseInt(moment().format('YYYY'));

		// bioticos - abioticos - agrega variable biotica
		if(params[0] === "true"){
			tfilters.push({
				field: "clasevalida",
				value: "Mammalia",
				type: 4
			});

		}

		// bioticos - abioticos - agrega variable abiotica
		if(params[1] === "true"){
			tfilters.push({
				value: "bio01",
				type: 0,
				level: 1,
				label: "Temperatura+media+anual"
			});

		}

		// bioticos - abioticos - con rango
		if(params[4] === "true"){
			lim_inf = 2000
		}
		
		it("Should get information about the result of a niche analysis grouped by specie frequency.", function(done){
			supertest(server).post("/niche/getFreq")
			.send({
				id: 27332,
				idtime: "1519077493248",
				min_occ: 1,
				fossil: params[2],
				sfecha: params[3],
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
				// console.log("random_index: " + random_index);

				expect(res.body).to.have.property("data")
				expect(res.body.data).all.have.property("bucket")
				expect(res.body.data).all.have.property("freq_score")
				expect(res.body.data).all.have.property("min_score")
				expect(res.body.data).all.have.property("max_score")
				expect(res.body.data).all.have.property("freq_epsilon")
				expect(res.body.data).all.have.property("min_epsilon")
				expect(res.body.data).all.have.property("max_epsilon")
				// expect(res.body.data[random_index].bucket).not.to.be.empty;
				expect(res.body.data[random_index].freq_score).not.to.be.empty;
				expect(res.body.data[random_index].min_score).not.to.be.empty;
				expect(res.body.data[random_index].max_score).not.to.be.empty;
				expect(res.body.data[random_index].freq_epsilon).not.to.be.empty;
				expect(res.body.data[random_index].min_epsilon).not.to.be.empty;
				expect(res.body.data[random_index].max_epsilon).not.to.be.empty;
				// bucket is always equal to 20
				expect(res.body.data[length].bucket).to.be.equal(20)
				
				done();
			})

		})

	})

});



