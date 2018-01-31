/*
* @Author: Raul Sierra
* @Date:   2017-10-26 15:48:28
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2018-01-31 11:21:27
*/
var supertest = require("supertest");
var expect = require('chai').expect;

var chai = require("chai");
chai.should();
chai.use(require('chai-things'));
// var server = supertest.agent("http://localhost:8080");



console.info("************************************\n")
console.info("VALORES DEFAULT:\nEspecie: 'Lynx Rufus' \nBioticos: 'Mammalia' \nAbioticos: 'Bioclim' \nRango fechas: 2000-2017 \nResolucion Malla: 16km \nMin Occ: 10 \nRes: Resolución");
console.info("\n************************************")
console.info("\nABREVIACIONES:\nNP: No parametros \nNF: No filtros \nB: Bioticos \nA: Abioticos \nAB: Ambos \nReg: Registros \nSF:Sin Filtros");
console.info("\n************************************\n")

var server

beforeEach(function () {
	delete require.cache[require.resolve('../../server')]
	server = require('../../server')
})

afterEach(function (done) {
	server.close(done)
})

describe("Test cells endpoint",function(){
	var last_cells_size = 0;
	var spid = 27336 //Jaguar (Panthera onca)
	it("Should return a 200 response", function(done){

		supertest(server).post("/niche/cells")
		.send({})
		.expect("Content-type",/json/)
		.expect(200, done);
	});

	it("Should respond with a listening message", function(done){

		supertest(server).post("/niche/cells")
		.send({})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("msg");
			expect(res.body.msg).to.equal("cells endpoint listening")
			done();
		})
	});

	it("Should get resolution of 16km as default", function(done){
		supertest(server).post("/niche/cells")
		.send({
			sp_id : spid
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("cells_16km")
			done();
		})

	});

	it("Should get cells for Panthera onca", function(done){
		supertest(server).post("/niche/cells")
		.send({
			sp_id : spid
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("data")
			expect(res.body.data).to.not.equal(null)
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("cells_16km")
			expect(res.body.data).to.have.property("especie")
			expect(res.body.data.especie).to.equal("Panthera onca")
			done();
		})

	});


	it("Should get the cells containing a given species at default resolution", function(done){
		supertest(server).post("/niche/cells")
		.send({
			sp_id : spid
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("data")
			expect(res.body.data).to.not.equal(null)
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("cells_16km")
			expect(res.body.data).to.have.property("cell_ids")
			expect(res.body.data.cell_ids).to.be.an("array")
			expect(res.body.data.cell_ids).to.have.length.above(0)
			done();
		})

	});

	[8, 16, 32, 64].forEach(value => {
		it("Should get the cells containing a given species at res " + value + " km", function(done){
			var spid = 27336;

			supertest(server).post("/niche/cells")
			.send({
				sp_id: spid,
				cells_res: value
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, res){
				expect(res.body).to.have.property("data")
				expect(res.body.data).to.not.equal(null)
				expect(res.body).to.have.property("cells_col")
				expect(res.body.cells_col).to.equal("cells_" + value + "km")
				expect(res.body.data).to.have.property("cell_ids")
				expect(res.body.data.cell_ids).to.be.an("array")
				expect(res.body.data.cell_ids).to.have.length.above(0)
				done();
			})
		});
	});

	var niveles_tax = [ 
		["generovalido", "Panthera"],
		["familiavalida", "Felidae"],
		["ordenvalido", "Carnivora"],
		["clasevalida", "Mammalia"]
	];

	niveles_tax.forEach(pair => {
		it("Should get the cells for " + pair, function(done){
			this.timeout(120000);
			supertest(server).post("/niche/cells")
			.send({
				tax_level: pair[0],
				tax_name: pair[1],
				cells_res: 64
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, res){
				expect(res.body).to.have.property("cells_col")
				expect(res.body.cells_col).to.equal("gridid_64km")
				expect(res.body).to.have.property("data")
				expect(res.body.data).all.have.property("cell_id")
				expect(res.body.data).not.to.include({"cell_id": null})
				done();
			})
		});
	});

	[8, 16, 32, 64].forEach(cell_res => {
		it("Should get the cells for genus Panthera at resolution " + cell_res, function(done){

			supertest(server).post("/niche/cells")
			.send({
				tax_level: "generovalido",
				tax_name: "Panthera",
				cells_res: cell_res
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, res){
				expect(res.body).to.have.property("cells_col")
				expect(res.body.cells_col).to.equal("gridid_" + cell_res + "km")
				expect(res.body).to.have.property("data")
				expect(res.body.data).all.have.property("cell_id")
				done();
			})
		});
	});

	[[false, false], [true, true], [false, true], [true, false]].forEach(pair => {
		it("Should get the cells for genus Panthera with (fossil, sfecha) = " + pair, function(done){

			supertest(server).post("/niche/cells")
			.send({
				tax_level: "generovalido",
				tax_name: "Panthera",
				fossil: pair[0],
				sfecha: pair[1]
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, res){
				expect(res.body).to.have.property("cells_col")
				expect(res.body.cells_col).to.equal("gridid_16km")
				expect(res.body).to.have.property("data")
				expect(res.body.data).all.have.property("cell_id")
				done();
			})
		});
	});
	
	it("Should get the right number of cells for species Panthera onca with (fossil=true, sfecha=true) = ", function(done){
		supertest(server).post("/niche/cells")
		.send({
			tax_level: "especievalida",
			tax_name: "Panthera onca",
			fossil: "true",
			sfecha: "true"
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("gridid_16km")
			expect(res.body).to.have.property("data")
			expect(res.body.data).all.have.property("cell_id")
			expect(res.body.data).to.have.length(102)
			done();
		})
	});

	it("Should get the right number of cells for species Panthera onca with (fossil=true, sfecha=false) = ", function(done){
		supertest(server).post("/niche/cells")
		.send({
			tax_level: "especievalida",
			tax_name: "Panthera onca",
			fossil: "true",
			sfecha: "false"
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("gridid_16km")
			expect(res.body).to.have.property("data")
			expect(res.body.data).all.have.property("cell_id")
			expect(res.body.data).to.have.length(54)
			done();
		})
	});

	it("Should get the right number of cells for species Panthera onca with (fossil=false, sfecha=true) = ", function(done){
		supertest(server).post("/niche/cells")
		.send({
			tax_level: "especievalida",
			tax_name: "Panthera onca",
			fossil: "false",
			sfecha: "true"
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("gridid_16km")
			expect(res.body).to.have.property("data")
			expect(res.body.data).all.have.property("cell_id")
			expect(res.body.data).to.have.length(93)
			done();
		})
	});


	it("Should get the cells containing a given taxon for a given time period in years", function(done){
		var cells_res = 32
		supertest(server).post("/niche/cells")
		.send({
			tax_level : "generovalido",
			tax_name: "Panthera",
			start_year: 2000,
			end_year: 2010,
			cells_res: cells_res
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("data")
			expect(res.body.data).to.not.equal(null)
			expect(res.body.data).to.be.an("array")
			expect(res.body).to.have.property("cells_col")
			expect(res.body.cells_col).to.equal("gridid_" + cells_res + "km")
			expect(res.body.data).all.have.property("cell_id")
			expect(res.body.data).to.not.include({cell_id: null})
			expect(res.body.data).all.have.property("max_year")
			expect(res.body.data).all.have.property("min_year")
			expect(res.body.data).all.have.property("num_records")
			expect(res.body.data).to.have.length(13)
			expect(res.body.data).contain.an.item.with.property("cell_id", 12141)
			expect(res.body.data).to.include.something.deep.equals(
				{"cell_id": 12141,
				"generovalido": "Panthera",
				 "max_year": 2009,
				 "min_year": 2007,
				 "num_records": "3"})
			done();
		})

	});


});