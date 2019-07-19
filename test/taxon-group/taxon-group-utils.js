var supertest = require("supertest")
var should = require("should")
var expect = require('chai').expect
var moment = require('moment')
var debug = require('debug')('test:taxons-group-utils')
var chai = require("chai")
chai.use(require('chai-things'))

var server

beforeEach(function () {
	delete require.cache[require.resolve('../../server')]
	server = require('../../server')
})

afterEach(function (done) {
	server.close(done)
})


describe("Prueba de acceso al Middleware",function(){

	it("Middleware - DISPONIBLE", function(done){

		supertest(server).get("/niche/")
		.expect("Content-type",/json/)
		.expect(200, {
			data: {message: '¡Yey! Bienvenido al API de NICHE'}
		}, done)

	});
});

describe("Prueba verbo getSpeciesTaxonNiche", function(){

	this.timeout(100000 * 60 * 2);

	it("verbo getSpeciesTaxonNiche - DISPONIBLE", function(done){

		supertest(server).post("/niche/getSpeciesTaxonNiche")
		.send(
				{


				}
		).expect("Content-type",/json/)
		.expect(200)
		.end(function(err, response){
            response.statusCode.should.equal(200)
            expect(response.body.data).to.not.equal(null)
			done();
		})

	});

});

