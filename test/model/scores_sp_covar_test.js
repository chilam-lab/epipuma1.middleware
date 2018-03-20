/*
* @Author: Raul Sierra
* @Date:   2018-01-31 17:12:53
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-08 21:08:18
*/
var supertest = require("supertest");
var expect = require('chai').expect;
var moment = require('moment')

var chai = require("chai");
// chai.should();
chai.use(require('chai-things'));
// var server = supertest.agent("http://localhost:8080");

// console.info("************************************\n")
// console.info("Test services for statistical calculations.....");
// console.info("\n************************************")

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
						["true", "true","true","true", "true"], ["true", "true","true","false", "true"]

						// uncomment to test all possible biotic cases
						// ["true", "true","true","true", "true"], ["true", "false","true","true", "true"], ["false", "true","true","true", "true"], // bioticos - abioticos - con fosiles - con reg sin fecha - con rango
						// ["true", "true","true","true", "false"], ["true", "false","true","true", "false"], ["false", "true","true","true", "false"], // bioticos - abioticos - con fosiles - con reg sin fecha - sin rango
						// ["true", "true","true","false", "true"], ["true", "false","true","false", "true"], ["false", "true","true","false", "true"], // bioticos - abioticos - con fosiles - sin reg sin fecha - con rango
						// ["true", "true","true","false", "false"], ["true", "false","true","false", "false"], ["false", "true","true","false", "false"], // bioticos - abioticos - con fosiles - sin reg sin fecha - sin rango


						// ["true", "true","false","true", "true"], ["true", "false","false","true", "true"], ["false", "true","false","true", "true"], // bioticos - abioticos - sin fosiles - con reg sin fecha - con rango
						// ["true", "true","false","true", "false"], ["true", "false","false","true", "false"], ["false", "true","false","true", "false"], // bioticos - abioticos - sin fosiles - con reg sin fecha - sin rango
						// ["true", "true","false","false", "true"], ["true", "false","false","false", "true"], ["false", "true","false","false", "true"], // bioticos - abioticos - sin fosiles - sin reg sin fecha - con rango
						// ["true", "true","false","false", "false"], ["true", "false","false","false", "false"], ["false", "true","false","false", "false"] // bioticos - abioticos - sin fosiles - sin reg sin fecha - sin rango

					];


					
describe("\n========= Test scores between a Species and co-variables =========",function(){
	var grid_res = 32
	const spid = 27336
	const tax_level = "clasevalida"
	const tax_name = "Mammalia"
	const min_occ = 1;

	it("Should respond with a listening message", function(done){

		supertest(server).post("/niche/bio_scores")
		.send({})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("msg");
			expect(res.body.msg).to.equal("bio_scores endpoint listening")
			done();
		})
	});

	it("Should get all the statistics for one species VS a group of species using only the selected cells from the grid", function(done) {
		this.timeout(120000);
		supertest(server).post("/niche/bio_scores")
		.send({
			sp_id : spid,
			covar_tax_level: tax_level,
			covar_tax_name: tax_name,
			grid_res: grid_res,
			tfilters: [{
				field:"clasevalida", 
				value:"Mammalia", 
				type:"4"
			}],
			id: spid,
			min_occ: min_occ,
			fossil: false,
			sfecha: false,
			discardedDateFilterids: true,
			val_process: false,
			n_grid_coverage: 'species_coverage'		
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("grid_res")
			expect(res.body.grid_res).to.equal(grid_res)
			expect(res.body).to.have.property("N")
			expect(res.body.N).to.equal(3624)
			expect(res.body).to.have.property("var_name")
			expect(res.body.var_name).to.equal("Panthera onca")
			expect(res.body).to.have.property("data")
			expect(res.body.data).all.have.property("covar_name")
			expect(res.body.data).all.have.property("ni", 117)
			expect(res.body.data).all.have.property("nj")
			expect(res.body.data).not.contain.an.item.with.property('nj', 0)
			expect(res.body.data).all.have.property("nij")
			done();
		})
	})

	it("Should get results according to the given grid resolution", function(done) {
		this.timeout(12000);
		grid_res = 64
		supertest(server).post("/niche/bio_scores")
		.send({
			sp_id : spid,
			covar_tax_level: tax_level,
			covar_tax_name: tax_name,
			grid_res: grid_res,
			tfilters: [{
				field:"clasevalida", 
				value:"Mammalia", 
				type:"4"
			}],
			id: spid,
			min_occ: min_occ,
			fossil: false,
			sfecha: false,
			discardedDateFilterids: true,
			val_process: false,
			n_grid_coverage: 'species_coverage'		
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("grid_res")
			expect(res.body.grid_res).to.equal(grid_res)
			expect(res.body).to.have.property("N")
			expect(res.body.N).to.equal(1223)
			expect(res.body.data).all.have.property("epsilon")
			expect(res.body.data).not.contain.an.item.with.property('epsilon', null)
			expect(res.body.data).all.have.property("score")
			expect(res.body.data).not.contain.an.item.with.property('score', null)
			done();
		})
	})
})