/*
* @Author: Raul Sierra
* @Date:   2018-01-31 17:12:53
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-02-06 12:47:16
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

describe("Test scores where the N depends on the species grid coverage:\n",function(){
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
			id:27336,
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

	it("Should get cells with scores for one taxonomic group", function(done){
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
			id:27336,
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
			expect(res.body).to.have.property("data")
			expect(res.body.data).all.have.property("cell_id")
			expect(res.body.data).all.have.property("tscore")
			done();
		})
	});

});
