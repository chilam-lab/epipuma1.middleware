var supertest = require("supertest");
var should = require("should");
var expect = require('chai').expect;
var moment = require('moment');
var debug = require('debug')('test:taxons-group-community');
var chai = require("chai");
chai.use(require('chai-things'));

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

describe("Prueba verbo getTaxonsGroupNodes", function(){

	this.timeout(100000 * 60 * 2);

	it("verbo getTaxonsGroupNodes - DISPONIBLE", function(done){

		supertest(server).post("/niche/getTaxonsGroupNodes")
		.send(
				{
				  "source": [
				    {
				      "biotic": true,
				      "rank": "species",
				      "value": "Lynx rufus",
				      "level": "species"
				    },
				    {
				      "biotic": false,
				      "rank": "layer",
				      "value": "bio020",
				      "level": "bid"
				    }
				  ],
				  "target": [
				    {
				      "biotic": false,
				      "rank": "type",
				      "value": "1",
				      "level": "bid"
				    }
				  ],
				  "min_occ": 5,
				  "grid_res": "16",
				  "footprint_region": 1
				}

		).expect("Content-type",/json/)
		.expect(200)
		.end(function(err, response){
            response.statusCode.should.equal(200)
            expect(response.body.data).to.not.equal(null)
            expect(response.body.data).all.have.property("grp")
            expect(response.body.data).all.have.property("biotic")
            expect(response.body.data).all.have.property("reinovalido")
            expect(response.body.data).all.have.property("phylumdivisionvalido")
            expect(response.body.data).all.have.property("clasevalida")
            expect(response.body.data).all.have.property("familiavalida")
            expect(response.body.data).all.have.property("generovalido")
            expect(response.body.data).all.have.property("familiavalida")
            expect(response.body.data).all.have.property("nombreinfra")
            expect(response.body.data).all.have.property("especieepiteto")
            expect(response.body.data).all.have.property("layer")
            expect(response.body.data).all.have.property("type")
            expect(response.body.data).all.have.property("bid")
            expect(response.body.data).all.have.property("tag")
            expect(response.body.data).all.have.property("icat")
            expect(response.body.data).all.have.property("occ")
			done();
		})

	});

});


describe("Prueba verbo getTaxonsGroupEdges", function(){

	this.timeout(100000 * 60 * 2);

	it("verbo getTaxonsGroupEdges - DISPONIBLE", function(done){

		supertest(server).post("/niche/getTaxonsGroupEdges")
		.send(
				{
			  "source": [
			    {
			      "biotic": true,
			      "rank": "species",
			      "value": "Lynx rufus",
			      "level": "species"
			    },
			    {
			      "biotic": false,
			      "rank": "layer",
			      "value": "bio020",
			      "level": "bid"
			    }
			  ],
			  "target": [
			    {
			      "biotic": false,
			      "rank": "type",
			      "value": "1",
			      "level": "bid"
			    }
			  ],
			  "min_occ": 5,
			  "grid_res": "16",
			  "footprint_region": 1
			}

		).expect("Content-type",/json/)
		.expect(200)
		.end(function(err, response){
            response.statusCode.should.equal(200)
            expect(response.body.data).to.not.equal(null)
            expect(response.body.data).all.have.property("biotic_t")
            expect(response.body.data).all.have.property("reinovalido_t")
            expect(response.body.data).all.have.property("phylumdivisionvalido_t")
            expect(response.body.data).all.have.property("clasevalida_t")
            expect(response.body.data).all.have.property("familiavalida_t")
            expect(response.body.data).all.have.property("generovalido_t")
            expect(response.body.data).all.have.property("familiavalida_t")
            expect(response.body.data).all.have.property("nombreinfra_t")
            expect(response.body.data).all.have.property("especieepiteto_t")
            expect(response.body.data).all.have.property("layer_t")
            expect(response.body.data).all.have.property("type_t")
            expect(response.body.data).all.have.property("bid_t")
            //expect(response.body.data).all.have.property("tag_t")
            //expect(response.body.data).all.have.property("icat_t")

            expect(response.body.data).all.have.property("biotic_s")
            expect(response.body.data).all.have.property("reinovalido_s")
            expect(response.body.data).all.have.property("phylumdivisionvalido_s")
            expect(response.body.data).all.have.property("clasevalida_s")
            expect(response.body.data).all.have.property("familiavalida_s")
            expect(response.body.data).all.have.property("generovalido_s")
            expect(response.body.data).all.have.property("familiavalida_s")
            expect(response.body.data).all.have.property("nombreinfra_s")
            expect(response.body.data).all.have.property("especieepiteto_s")
            expect(response.body.data).all.have.property("layer_s")
            expect(response.body.data).all.have.property("type_s")
            expect(response.body.data).all.have.property("bid_s")
            //expect(response.body.data).all.have.property("tag_s")
            //expect(response.body.data).all.have.property("icat_s")

            expect(response.body.data).all.have.property("nij")
            expect(response.body.data).all.have.property("ni")
            expect(response.body.data).all.have.property("nj")
            expect(response.body.data).all.have.property("n")
            expect(response.body.data).all.have.property("value")
            expect(response.body.data).all.have.property("score")
			done();
		})

	});

});
