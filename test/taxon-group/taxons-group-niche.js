var supertest = require("supertest")
var should = require("should")
var expect = require('chai').expect
var moment = require('moment')
var debug = require('debug')('test:taxons-group-niche')
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


var variables_bioticas = 	[
		// {rank: "class",   value: "Reptilia", type: 0, level: "species"},
		// {rank: "order",   value: "Caryophyllales", type: 0, level: "family"},
		// {rank: "family",  value: "Curculionidae", type: 0, level: "species"},
		// {rank: "genus",   value: "Tillandsia", type: 0, level: "species"},
		{rank: "kingdom", value: "Animalia", type: 0, level: "species"},
		{rank: "phylum",  value: "Bacillariophyta", type: 0, level: "order"},
		{rank: "species", value: "Zea mays", type: 0, level: "subspecies"},
		{rank: "subspecies", value: "Urtica praetermissa praetermissa", type: 0, level: ""}
]

var variables_abioticas = [
		{"rank": "layer","value": "bio001","level": "bid"},
		{"rank": "type","value": "1","level": "bid"}
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

describe("Prueba verbo countsTaxonsGroup sin validacion", function() {

  this.timeout(100000 * 60 * 2);

  variables_abioticas.forEach(a_biotic => {

    variables_bioticas.forEach(biotic => {
      it("verbo countsTaxonsGroup - DISPONIBLE", function(done) {

        supertest(server).post("/niche/countsTaxonsGroup")
          .send({
            "time": "1559019929484",
            "grid_resolution": 16,
            "region": 1,
            "min_cells": 5,
            "idtabla": "",
            "fosil": true,
            "date": true,
            "get_grid_species": false,
            "apriori": false,
            "mapa_prob": false,
            "with_data_freq": false,
            "with_data_score_cell": false,
            "with_data_freq_cell": false,
            "with_data_score_decil": false,
            "excluded_cells": [],
            "covariables": [{
                "name": "GpoRaster1",
                "biotic": false,
                "merge_vars": [
                  a_biotic
                ],
                "group_item": 1
              },
              {
                "name": "GpoBio2",
                "biotic": true,
                "merge_vars": [
                  biotic
                ],
                "group_item": 2
              },
              {
                "name": "GpoBio3",
                "biotic": true,
                "merge_vars": [{
                  "rank": "order",
                  "value": "Sirenia",
                  "type": 0,
                  "level": "species"
                }],
                "group_item": 3
              }
            ],
            "target_taxons": [{
              "taxon_rank": "species",
              "value": "Lynx rufus"
            }]
          }).expect("Content-type", /json/)
          .expect(200)
          .end(function(err, response) {
            response.statusCode.should.equal(200)
            expect(response.body.data).to.not.equal(null)
            expect(response.body.data).all.have.property("reinovalido")
            expect(response.body.data).all.have.property("phylumdivisionvalido")
            expect(response.body.data).all.have.property("clasevalida")
            expect(response.body.data).all.have.property("ordenvalido")
            expect(response.body.data).all.have.property("familiavalida")
            expect(response.body.data).all.have.property("generovalido")
            expect(response.body.data).all.have.property("especieepiteto")
            expect(response.body.data).all.have.property("nombreinfra")
            expect(response.body.data).all.have.property("type")
            expect(response.body.data).all.have.property("layer")
            expect(response.body.data).all.have.property("bid")
            expect(response.body.data).all.have.property("icat")
            expect(response.body.data).all.have.property("tag")
            expect(response.body.data).all.have.property("cells")
            expect(response.body.data).all.have.property("cells_map")
            expect(response.body.data).all.have.property("nij")
            expect(response.body.data).all.have.property("nj")
            expect(response.body.data).all.have.property("ni")
            expect(response.body.data).all.have.property("n")
            expect(response.body.data).all.have.property("epsilon")
            expect(response.body.data).all.have.property("score")
            expect(response.body.data).all.have.property("tipo")
            done();
          })

      });
    });
  });

});
