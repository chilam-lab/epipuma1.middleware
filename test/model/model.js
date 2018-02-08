/*
* @Author: Raul Sierra
* @Date:   2018-01-31 17:12:53
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-08 14:37:06
*/
var supertest = require("supertest");
var expect = require('chai').expect;

var chai = require("chai");
chai.should();
chai.use(require('chai-things'));
// var server = supertest.agent("http://localhost:8080");



console.info("************************************\n")
console.info("Test services for statistical calculations.....");
console.info("\n************************************")
console.info("\n************************************\n")

var server

beforeEach(function () {
	delete require.cache[require.resolve('../../server')]
	server = require('../../server')
})

afterEach(function (done) {
	server.close(done)
})

describe("Test scores where the N depends on the species grid coverage:\nTesting with Panthera onca",function(){
	var cells_res = 32
	var spid = 27336
	var tax_level = "clasevalida"
	var tax_name = "Mammalia"

	it("Should respond with a listening message", function(done){

		supertest(server).post("/niche/grid_scores")
		.send({})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("msg");
			expect(res.body.msg).to.equal("grid_scores endpoint listening")
			done();
		})
	});

	it("Should get the right number of occupied cells by " + tax_name, function(done){
		this.timeout(120000);
		supertest(server).post("/niche/grid_scores")
		.send({
			sp_id : spid,
			covar_tax_level: tax_level,
			covar_tax_name: tax_name,
			cells_res: cells_res,
			tfilters: [{
				field:"clasevalida", 
				value:"Mammalia", 
				type:"4"
			}],
			qtype: "getMapScoreCeldaDecil",
			id: spid,
			idreg: "Estados",
			idtime: 1517867953937,
			min_occ: 1,
			fossil: false,
			sfecha: false,
			discardedDateFilterids: true,
			val_process: false,
			idtabla: "no_table",
			hasBios: true,
			hasRaster: false
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("gridid_" + cells_res + "km")
			expect(res.body).to.have.property("N")
			expect(res.body.N).to.be.a('number')
			expect(res.body.N).to.equal(3624)
			done();
		})
	});

	it("Should get cells with scores with one taxonomic group", function(done){
		this.timeout(120000);
		supertest(server).post("/niche/grid_scores")
		.send({
			sp_id : spid,
			covar_tax_level: tax_level,
			covar_tax_name: tax_name,
			cells_res: cells_res,
			tfilters: [{
				field:"clasevalida", 
				value:"Mammalia", 
				type:"4"
			}],
			qtype: "getMapScoreCeldaDecil",
			idreg: "Estados",
			idtime: 1517867953937,
			min_occ: 1,
			fossil: false,
			sfecha: false,
			discardedDateFilterids: true,
			val_process: false,
			idtabla: "no_table",
			hasBios: true,
			hasRaster: false,
			n_grid_coverage: 'species_coverage'		
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("gridid_" + cells_res + "km")
			expect(res.body).to.have.property("N")
			expect(res.body.N).to.be.a('number')
			expect(res.body.N).to.equal(3624)
			expect(res.body).to.have.property("data")
			expect(res.body.data).all.have.property("gridid")
			expect(res.body.data).all.have.property("tscore")
			expect(res.body.data).to.have.length(3599)
			done();
		})
	});
});

describe("Test scores between a Species and co-variables\n",function(){
	const grid_res = 32
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
		this.timeout(12000);
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
			expect(res.body.data).to.include.something.deep.equals(
				{"covar_name": "Artibeus toltecus",
				 "var_name": "Panthera onca",
				 "ni": 117,
				 "nj": 92,
				 "nij": 24})
			expect(res.body.data).all.have.property("epsilon")
			expect(res.body.data).all.have.property("score")
			done();
		})
	})

})
