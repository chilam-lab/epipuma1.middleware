/*
* @Author: Raul Sierra
* @Date:   2017-11-28 13:09:01
* @Last Modified by:   Raul Sierra
* @Last Modified time: 2017-12-01 11:38:18
*/
var supertest = require("supertest");
var expect = require('chai').expect;

var chai = require("chai");
chai.should();
chai.use(require('chai-things'));
// var server = supertest.agent("http://localhost:8080");



console.info("************************************\n")
console.info("Test queries that ask for infomation about the biodiversity contained in the DB");
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

describe("Test taxa endpoint",function(){
	it("Should get taxon data by id", function(done){
		var spid = 27336
		supertest(server).get("/taxa/" + spid)
		.expect("Content-type", /json/)
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("spid")
			expect(res.body.spid).to.equal(spid)
			expect(res.body).to.have.property("valid_name")
			expect(res.body.valid_name).to.equal("Panthera onca")
			expect(res.body).to.have.property("tax_level")
			expect(res.body.tax_level).to.equal("species")
			done();
		})
	});
})

describe("Test taxa/children endpoint",function(){
	it("Should return a 200 response", function(done){
		supertest(server).post("/taxa/children")
		.send({})
		.expect("Content-type",/json/)
		.expect(200, done);
	});

	it("Should respond with a listening message", function(done){

		supertest(server).post("/taxa/children")
		.send({})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res) {
			expect(res.body).to.have.property("msg")
			expect(res.body.msg).to.equal("taxa/children endpoint listening")
			done();
		})
	});

	root_level_value = "Panthera"
	root_level = "generovalido"
	child_level = "especievalidabusqueda"
	it("Should get all " + root_level_value, function(done){
		supertest(server).post("/taxa/children")
		.send({
			root_level : root_level,
			root_name : root_level_value,
			child_level : child_level
		})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, res){
			expect(res.body).to.have.property("data")
			expect(res.body.data).to.be.an("array")
			expect(res.body.data).to.have.length.above(0)
			expect(res.body.data).all.have.property("scientific_name")
			done();
		})
	});
})


