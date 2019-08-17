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

var variables_bioticas = [
	{"biotic": true, "rank": "kingdom", "value": "Animalia", "level": "genus"},
	{"biotic": true, "rank": "order", "value": "Caryophyllales", "level": "subpecies"},
	{"biotic": true, "rank": "genus", "value": "Tillandsia", "level": "species"},
	{"biotic": true, "rank": "species", "value": "Zea mays", "level": "species"}
]


var variables_abioticas = [
	[
	  {"biotic": false,"rank": "layer","value": "bio001","level": "bid"},
	  {"biotic": false,"rank": "type","value": "1","level": "bid"}
	],
	[
	  {"biotic": false,"rank": "type","value": "1","level": "bid"},
	  {"biotic": false,"rank": "layer","value": "bio001","level": "bid"}
	]
]


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

	variables_abioticas.forEach(a_biotic => {

	  variables_bioticas.forEach(biotic => {

	    it("verbo getTaxonsGroupNodes - DISPONIBLE", function(done) {

	      supertest(server).post("/niche/getTaxonsGroupNodes")
	        .send({
	            "source": [
	              biotic,
	              a_biotic[0]
	            ],
	            "target": [
	              a_biotic[1]
	            ],
	            "min_occ": 5,
	            "grid_res": "16",
	            "footprint_region": 1
	          }

	        ).expect("Content-type", /json/)
	        .expect(200)
	        .end(function(err, response) {
	          response.statusCode.should.equal(200)
	          expect(response.body.data).to.not.equal(null)
	          expect(response.body.data).all.have.property("grp")
	          expect(response.body.data).all.have.property("biotic")
	          expect(response.body.data).all.have.property("reinovalido")
	          expect(response.body.data).all.have.property("phylumdivisionvalido")
	          expect(response.body.data).all.have.property("clasevalida")
	          expect(response.body.data).all.have.property("ordenvalido")
	          expect(response.body.data).all.have.property("familiavalida")
	          expect(response.body.data).all.have.property("generovalido")
	          expect(response.body.data).all.have.property("nombreinfra")
	          expect(response.body.data).all.have.property("especieepiteto")
	          expect(response.body.data).all.have.property("layer")
	          expect(response.body.data).all.have.property("label")
	          expect(response.body.data).all.have.property("type")
	          expect(response.body.data).all.have.property("bid")
	          expect(response.body.data).all.have.property("tag")
	          expect(response.body.data).all.have.property("icat")
	          expect(response.body.data).all.have.property("occ")
	          done();
	        })

	    });
	  });

	});
	
});


describe("Prueba verbo getTaxonsGroupEdges", function(){

	this.timeout(100000 * 60 * 2);
	
	variables_abioticas.forEach(a_biotic => {

	  variables_bioticas.forEach(biotic => {

	    it("verbo getTaxonsGroupEdges - DISPONIBLE", function(done) {

	      supertest(server).post("/niche/getTaxonsGroupEdges")
	        .send({
	            "source": [
	              biotic,
	              a_biotic[0]
	            ],
	            "target": [
	              a_biotic[1]
	            ],
	            "min_occ": 5,
	            "grid_res": "16",
	            "footprint_region": 1
	          }
	        ).expect("Content-type", /json/)
	        .expect(200)
	        .end(function(err, response) {
	          response.statusCode.should.equal(200)
	          expect(response.body.data).to.not.equal(null)
	          expect(response.body.data).all.have.property("biotic_t")
	          expect(response.body.data).all.have.property("reinovalido_t")
	          expect(response.body.data).all.have.property("phylumdivisionvalido_t")
	          expect(response.body.data).all.have.property("clasevalida_t")
	          expect(response.body.data).all.have.property("ordenvalido_t")
	          expect(response.body.data).all.have.property("familiavalida_t")
	          expect(response.body.data).all.have.property("generovalido_t")
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
	          expect(response.body.data).all.have.property("ordenvalido_s")
	          expect(response.body.data).all.have.property("familiavalida_s")
	          expect(response.body.data).all.have.property("generovalido_s")
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
	});

});
