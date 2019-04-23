var supertest = require("supertest");
var should = require("should");
var expect = require('chai').expect;
var moment = require('moment')

var chai = require("chai");
chai.use(require('chai-things'));

console.info("************************************\n")
console.info("VALORES DEFAULT:\nTaxon Target: {'genus':'Lynx'} \nCovar Biotica: {'order':'Rodentia'} \nCovar Abiotica: {'layer':'bio005'} \nRango fechas: 2000-2017 \nResolucion Malla: 16km \nMin Occ: 10 \nRes: Resolución");
console.info("\n************************************")
console.info("\nABREVIACIONES:\nNP: No parametros \nNF: No filtros \nB: Bioticos \nA: Abioticos \nAB: Ambos \nReg: Registros \nSF:Sin Filtros");
console.info("\n************************************\n")

var server

beforeEach(function () {
	delete require.cache[require.resolve('../server')]
	server = require('../server')
})

afterEach(function (done) {
	server.close(done)
})

[[[{value:"bio001",type:1,level:2,group_item:1,label:"Annual Mean Temperature"}], false, true], 
 [[                    {field:"generovalido",value:"Aedes",type:0,group_item:1}], true, false], 
 [[{value:"bio001",type:1,level:2,group_item:1,label:"Annual Mean Temperature"},
 			{field:"generovalido",value:"Aedes",type:0,group_item:1}           ], true, true ]].forEach(pars => {
 	
 	describe("Prueba verbo counts", function(){

		this.timeout(100000 * 60 * 2);

		it("verbo counts - DISPONIBLE", function(done){

			supertest(server).post("/niche/counts")
			.send(
					{
					  "grid_resolution": 16,
					  "region": 1,
					  "min_cells": 5,
					  "idtabla":"tbl_1555968426396",
					  "fosil": true,
					  "date": true,
					  "lim_inf": 1500,
					  "lim_sup": 2020,
					  "longitud":-116.924717380997,
					  "latitud": 32.0356970982985,
					  "get_grid_species": false,
					  "apriori": true,
					  "mapa_prob":false,
					  "with_data_score_cell": true,
					  "with_data_freq": false,
					  "with_data_freq_cell":false,
					  "excluded_cells":[],
					  "target_name": "targetGroup",
					  "target_taxons": [
					    {
					      "taxon_rank": "genus",
					      "value": "Lynx"
					    }
					  ],
					  "covariables": [
					    {
					      "name": "group1",
					      "biotic": true,
					      "merge_vars": [
					        {
					          "rank": "order",
					          "value": "Rodentia"
					        }
					      ]
					    }
					    
					  ]
					}
			).expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
	            response.statusCode.should.equal(200)
	            expect(response.body.data).to.not.equal(null)
	            expect(response.body.data).all.have.property("spid")
	            expect(response.body.data).all.have.property("tipo")
	            expect(response.body.data).all.have.property("reinovalido")
	            expect(response.body.data).all.have.property("phylumdivisionvalido")
	            expect(response.body.data).all.have.property("clasevalida")
	            expect(response.body.data).all.have.property("familiavalida")
	            expect(response.body.data).all.have.property("generovalido")
	            expect(response.body.data).all.have.property("familiavalida")
	            expect(response.body.data).all.have.property("especievalidabusqueda")
	            expect(response.body.data).all.have.property("cells")
	            expect(response.body.data).all.have.property("ni")
	            expect(response.body.data).all.have.property("nij")
	            expect(response.body.data).all.have.property("n")
	            expect(response.body.data).all.have.property("epsilon")
	            expect(response.body.data).all.have.property("score")
				done();
			})

		});

	});
});

