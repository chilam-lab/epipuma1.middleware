var supertest = require("supertest");
var should = require("should");

// var server = supertest.agent("http://localhost:8080");



console.info("************************************\n")
console.info("VALORES DEFAULT:\nEspecie: 'Lynx Rufus' \nBioticos: 'Mammalia' \nAbioticos: 'Bioclim' \nRango fechas: 2000-2017 \nResolucion Malla: 16km \nMin Occ: 10 \nRes: Resolución");
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

describe("Prueba de acceso al Middleware",function(){

	it("Middleware - DISPONIBLE", function(done){

		supertest(server).get("/niche/")
		.expect("Content-type",/json/)
		.expect(200, {
			data: {message: '¡Yey! Bienvenido al API de NICHE'}
		}, done)

	});
});



describe("Prueba petición variables abioticas",function(){

	it("Árbol variables abioticas - DISPONIBLE", function(done){

		supertest(server).post("/niche/especie")
		.send({level : 0, qtype : "getRasterVariables", type: 1})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, response){
			response.statusCode.should.equal(200)
			// response.res.text.includes('FeatureCollection').should.equal(true)
			done();
		})

	});

});

describe("Prueba busqueda de especies",function(){

	it("Buscador de especies - DISPONIBLE", function(done){

		supertest(server).post("/niche/especie")
		.send({limit : 15, nivel: "especievalidabusqueda", qtype : "getEntList", searchStr: "Lynx", source: 1})
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, response){
			response.statusCode.should.equal(200)
			// response.res.text.includes('FeatureCollection').should.equal(true)
			done();
		})

	});

});



describe("Prueba recuperación de ocurrencias de especies",function(){

	this.timeout(1000 * 60 * 2); // 3 minutos maximo
	var spid = 28923;

	describe("\nOcurrencias de especies | SF ",function(){

		it("Ocurrencias de especies SF - DISPONIBLE", function(done){

			supertest(server).post("/niche/especie")
			.send({
				id : spid, 
				idtime: "1506398422062", 
				qtype: "getSpecies", 
				sfecha: "true", 
				sfosil: "true"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});


	})


	describe("\nOcurrencias de especies | F: Reg sin Fecha ",function(){

		it("Ocurrencias de especies | F: Reg sin Fecha - DISPONIBLE", function(done){

			supertest(server).post("/niche/especie")
			.send({
				id : spid, 
				idtime: "1506398422062", 
				qtype: "getSpecies", 
				sfecha: "false", 
				sfosil: "true"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nOcurrencias de especies | F: Sin Fosiles ",function(){

		it("Ocurrencias de especies | F: Sin Fosiles - DISPONIBLE", function(done){

			supertest(server).post("/niche/especie")
			.send({
				id : spid, 
				idtime: "1506398422062", 
				qtype: "getSpecies", 
				sfecha: "true", 
				sfosil: "false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nOcurrencias de especies | F: Con Rango de fechas ",function(){

		it("Ocurrencias de especies | F: Con Rango de fechas - DISPONIBLE", function(done){

			supertest(server).post("/niche/especie")
			.send({
				id : spid, 
				idtime: "1506398422062", 
				qtype: "getSpecies", 
				sfecha: "true", 
				sfosil: "true",
				lim_inf: 2000,
				lim_sup: 2020
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})

});




describe("Prueba de petición de mallas.",function(){

	describe("\nPetición de la malla de 8km:",function(){

		it("Malla de 8km - DISPONIBLE", function(done){

			supertest(server).post("/niche/especie")
			.send({grid_res : 8, qtype : "getGridGeoJsonMX"})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})


		});

	});


	describe("\nPetición de la malla de 16km:",function(){

		it("Malla de 16km - DISPONIBLE", function(done){

			supertest(server).post("/niche/especie")
			.send({grid_res : 16, qtype : "getGridGeoJsonMX"})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})


		});

	});

	describe("\nPetición de la malla de 32km:",function(){

		it("Malla de 32km - DISPONIBLE", function(done){

			supertest(server).post("/niche/especie")
			.send({grid_res : 32, qtype : "getGridGeoJsonMX"})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})


		});

	});

	describe("\nPetición de la malla de 64km:",function(){

		it("Malla de 64km  - DISPONIBLE", function(done){

			supertest(server).post("/niche/especie")
			.send({grid_res : 64, qtype : "getGridGeoJsonMX"})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})


		});

	});

	
});


describe("Prueba de verbo getGeoRel",function(){

	this.timeout(1000 * 60 * 2); // 3 minutos maximo

	
	
	describe("\nVerbo getGeoRel | NP | NF | B ",function(){

		it("Verbo: getGeoRel | NP | NF | B  - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla:"no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | NP | F: Sin Reg Fosiles | B ",function(){

		it("Verbo: getGeoRel | NP | F: Sin Reg Fosiles | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"false",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla:"no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | NP | F: Sin Reg sin Fecha | B ",function(){

		it("Verbo: getGeoRel | NP | F: Sin Reg sin Fecha | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"false",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla:"no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | NP | F: Con Rango de fechas | B ",function(){

		it("Verbo: getGeoRel | NP | F: Con Rango de fechas | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				lim_inf: 2000,
				lim_sup: 2020,
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla:"no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | NP | F: Sin Reg Fosiles & Sin Reg sin Fecha | B ",function(){

		it("Verbo: getGeoRel | NP | F: Sin Reg Fosiles & Sin Reg sin Fecha | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"false",
				sfecha:"false",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla:"no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | NP | F: Sin Reg Fosiles & Con Rango de fechas | B ",function(){

		it("Verbo: getGeoRel | NP | F: Sin Reg Fosiles & Con Rango de fechas | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"false",
				sfecha:"true",
				lim_inf: 2000,
				lim_sup: 2020,
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla:"no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | NP | F: Sin Reg sin Fecha & Con Rango de fechas | B ",function(){

		it("Verbo: getGeoRel | NP | F: Sin Reg sin Fecha & Con Rango de fechas | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"false",
				lim_inf: 2000,
				lim_sup: 2020,
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla:"no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})

	describe("\nVerbo getGeoRel | NP | F: Sin Reg Fosiles & Sin Reg sin Fecha & Con Rango de fechas | B ",function(){

		it("Verbo: getGeoRel | NP | F: Sin Reg Fosiles & Sin Reg sin Fecha & Con Rango de fechas | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				lim_inf: 2000,
				lim_sup: 2020,
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla:"no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | P: Con Validacion | NF | B ",function(){

		it("Verbo: getGeoRel | P: Con Validacion | NF | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"true",
				idtabla: "temp_01",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | P: Min Occ | NF | B ",function(){

		it("Verbo: getGeoRel | P: Min Occ | NF | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla: "no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false",
				min_occ: 10
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | P: Con Apriori | NF | B ",function(){

		it("Verbo: getGeoRel | P: Con Apriori | NF | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla: "no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false",
				apriori: "apriori"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | P: Con Mapa Prob | NF | B ",function(){

		it("Verbo: getGeoRel | P: Con Mapa Prob | NF | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla: "no_table",
				res_celda_sp:"cells_16km",
				res_celda_snib:"gridid_16km",
				res_celda_snib_tb:"grid_16km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false",
				mapa_prob: "mapa_prob"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})
	


	describe("\nVerbo getGeoRel | P: Res 8km | NF | B ",function(){

		it("Verbo: getGeoRel | P: Res 8km | NF | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla: "no_table",
				res_celda_sp:"cells_8km",
				res_celda_snib:"gridid_8km",
				res_celda_snib_tb:"grid_8km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})

	describe("\nVerbo getGeoRel | P: Res 32km | NF | B ",function(){

		it("Verbo: getGeoRel | P: Res 32km | NF | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla: "no_table",
				res_celda_sp:"cells_32km",
				res_celda_snib:"gridid_32km",
				res_celda_snib_tb:"grid_32km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})


	describe("\nVerbo getGeoRel | P: Res 64km | NF | B ",function(){

		it("Verbo: getGeoRel | P: Res 64km | NF | B - DISPONIBLE", function(done){

			var spid = 28923;

			supertest(server).post("/niche/getGeoRel")
			.send({
				qtype:"getGeoRel", 
				id: spid,
				idreg:"Estados",
				idtime:"1506389557454",
				fossil:"true",
				sfecha:"true",
				discardedDateFilterids:"false",
				val_process:"false",
				idtabla: "no_table",
				res_celda_sp:"cells_64km",
				res_celda_snib:"gridid_64km",
				res_celda_snib_tb:"grid_64km_aoi",
				tfilters: [{
					field:"clasevalida", 
					value:"Mammalia", 
					type:"4"
				}],
				hasBios:"true",
				hasRaster:"false"
			})
			.expect("Content-type",/json/)
			.expect(200)
			.end(function(err, response){
				response.statusCode.should.equal(200)
				// response.res.text.includes('FeatureCollection').should.equal(true)
				done();
			})

		});

	})
	
	
	// TODO: Faltan agregar prueba de combinaciones en parametros y parametros con filtros
	
});