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


describe("Prueba de acceso al Middleware",function(){

	it("Middleware - DISPONIBLE", function(done){

		supertest(server).get("/niche/")
		.expect("Content-type",/json/)
		.expect(200, {
			data: {message: '¡Yey! Bienvenido al API de NICHE'}
		}, done)

	});
});

describe("Prueba verbo countsTaxonsGroup sin validacion", function(){

	this.timeout(100000 * 60 * 2);

	it("verbo countsTaxonsGroup - DISPONIBLE", function(done){

		supertest(server).post("/niche/countsTaxonsGroup")
		.send(
				{
					"time": "1559019929484",
					"grid_resolution": 16,
					"region":1,
					"min_cells":5,
					"idtabla":"",
					"fosil":true,
					"date":true,
					"get_grid_species":false,
					"apriori":false,
					"mapa_prob":false,
					"with_data_freq":false,
					"with_data_score_cell":false,
					"with_data_freq_cell":false,
					"with_data_score_decil":false,
					"excluded_cells":[],
					"covariables":[
						{
							"name":"GpoRaster1","biotic":false,
							"merge_vars":
							[
								{"rank":"type","value":1,"type":1,"level":"bid"}
							],
							"group_item":1
						},
						{
							"name":"GpoBio2",
							"biotic":true,
							"merge_vars":
								[
									{"rank":"order","value":"Didelphimorphia","type":0,"level":"species"}
								],
							"group_item":2
						},
						{
							"name":"GpoBio3",
							"biotic":true,
							"merge_vars":
								[
									{"rank":"order","value":"Sirenia","type":0,"level":"species"}
								],
							"group_item":3
						}
					],
					"target_taxons":
						[
							{
								"taxon_rank":"species",
								"value":"Lynx rufus"
							}
						]
				}
		).expect("Content-type",/json/)
		.expect(200)
		.end(function(err, response){
            response.statusCode.should.equal(200)
            expect(response.body.data).to.not.equal(null)
            expect(response.body.data).all.have.property("tipo")
            expect(response.body.data).all.have.property("reinovalido")
            expect(response.body.data).all.have.property("phylumdivisionvalido")
            expect(response.body.data).all.have.property("clasevalida")
            expect(response.body.data).all.have.property("familiavalida")
            expect(response.body.data).all.have.property("generovalido")
            expect(response.body.data).all.have.property("familiavalida")
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

