var supertest = require("supertest");
var should = require("should");
var expect = require('chai').expect;
var moment = require('moment')

var chai = require("chai");
// chai.should();
chai.use(require('chai-things'));


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



describe("Prueba petición variables abioticas, su contenido y su tamaño",function(){

	it("Árbol variables abioticas - DISPONIBLE", function(done){

		supertest(server).get("/niche/especie/getRasterVariables")
		.expect("Content-type",/json/)
		.expect(200)
		.end(function(err, response){
			response.statusCode.should.equal(200)
			expect(response.body.data).to.not.equal(null)
			expect(response.body.data).all.have.property("fuente")
			expect(response.body.data).all.have.property("type")
			done();
		})

	});

});



// describe("Prueba búsqueda de especies, su contenido y tipo de valor",function(){

// 	it("Buscador de especies - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/especie/getEntList")
// 		.send({limit : 15, nivel: "especievalidabusqueda", searchStr: "Lynx", source: 1, grid_res: 16, footprint_region: 3})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.data).all.have.property("spid")
// 			expect(response.body.data).all.have.property("reinovalido")
// 			expect(response.body.data).all.have.property("phylumdivisionvalido")
// 			expect(response.body.data).all.have.property("clasevalida")
// 			expect(response.body.data).all.have.property("ordenvalido")
// 			expect(response.body.data).all.have.property("familiavalida")
// 			expect(response.body.data).all.have.property("generovalido")
// 			expect(response.body.data).all.have.property("especievalidabusqueda")
// 			expect(response.body.data).all.have.property("occ")
// 			expect(response.body.data[0].spid).to.be.a("number")
// 			expect(response.body.data[0].occ).to.be.a("number")
// 			expect(response.body.data[0].reinovalido).to.be.a("string")
// 			expect(response.body.data[0].phylumdivisionvalido).to.be.a("string")
// 			expect(response.body.data[0].clasevalida).to.be.a("string")
// 			expect(response.body.data[0].ordenvalido).to.be.a("string")
// 			expect(response.body.data[0].familiavalida).to.be.a("string")
// 			expect(response.body.data[0].generovalido).to.be.a("string")
// 			expect(response.body.data[0].especievalidabusqueda).to.be.a("string")
// 			done();
// 		})

// 	});

// });


// // [["false", "false", "false"], ["false", "false", "true"], ["true", "true", "true"], ["true", "true", "false"], ["false", "true", "false"], ["false", "true", "true"], ["true", "false", "true"], ["true", "false", "false"]].forEach(pair => {

// // 	describe("Prueba obtención de ocurrencias de especie objetivo con (sfecha, rango, sfosil) => " + pair, function(done){

// // 		this.timeout(1000 * 60 * 2); // 3 minutos maximo
// // 		var spid = 27333;
// // 		var lim_inf = 1500
// // 		var lim_sup = parseInt(moment().format('YYYY'));

// // 		if(pair[1] === "false"){
// // 			lim_inf = 2000
// // 			lim_sup = 2020
// // 		}

// // 		describe("\nOcurrencias de especies ",function(){

// // 			it("Ocurrencias de especies - DISPONIBLE", function(done){

// // 				supertest(server).post("/niche/especie/getSpecies")
// // 				.send({
// // 					id : spid, 
// // 					sfecha: pair[0], 
// // 					sfosil: pair[2],
// // 					lim_inf: lim_inf,
// // 					lim_sup: lim_sup,
// // 					idtime: "1549052020331",
// // 					grid_res: 16,
// // 					footprint_region: 1
// // 				})
// // 				.expect("Content-type",/json/)
// // 				.expect(200)
// // 				.end(function(err, response){
// // 					response.statusCode.should.equal(200)
// // 					expect(response.body.data).all.have.property("json_geom")
// // 					expect(response.body.data).all.have.property("gridid")
// // 					expect(response.body.data).all.have.property("urlejemplar")
// // 					expect(response.body.data).all.have.property("aniocolecta")
// // 					expect(response.body.data[0].gridid).to.be.a("number")
// // 					expect(response.body.data[0].json_geom).to.be.a("string")
// // 					expect(response.body.data[0].json_geom).to.have.string("coordinates")
// // 					expect(response.body.data[0].json_geom).to.have.string("type")
// // 					done();
// // 				})

// // 			});


// // 		})

// // 	});


// // });




// describe("Petición de mallas a diferentes resoluciones y distintas regiones",function(){

// 	this.timeout(1000 * 60 * 2); // 3 minutos maximo

// 	[
// 	//8, 
// 	//16, 
// 	//32, 
// 	64].forEach(cell_res => {

// 		[1
// 		//, 2
// 		//, 3
// 		//, 4
// 		].forEach(footprint_region => {

// 			it("\nPetición de la malla de " + cell_res + "en la region numero " + footprint_region, 
// 			function(done){

// 				supertest(server).post("/niche/especie/getGridGeoJson")
// 				.send({grid_res : ""+cell_res, footprint_region:""+footprint_region})
// 				.expect("Content-type",/json/)
// 				.expect(200)
// 				.end(function(err, response){
// 					response.statusCode.should.equal(200)
// 					response.res.text.includes('FeatureCollection').should.equal(true)
// 					response.res.text.includes('features').should.equal(true)
// 					done();
// 				})
// 			});

// 		});

// 	});
// });


// [[[{value:"bio001",type:1,level:2,group_item:1,label:"Annual Mean Temperature"}], false, true], 
//  [[                    {field:"generovalido",value:"Aedes",type:0,group_item:1}], true, false], 
//  [[{value:"bio001",type:1,level:2,group_item:1,label:"Annual Mean Temperature"},
//  			{field:"generovalido",value:"Aedes",type:0,group_item:1}           ], true, true ]].forEach(pars => {
 	
//  	describe("Prueba verbo counts", function(){

// 		this.timeout(100000 * 60 * 2);

// 		it("verbo counts - DISPONIBLE", function(done){

// 			supertest(server).post("/niche/counts")
// 			.send(
// 					{
// 						time:"1550259505727",
// 						footprint_region:1,
// 						fossil:true,
// 						grid_res:16,
// 						hasBios: pars[1],
// 						hasRaster: pars[2],
// 						id:27333,
// 						idtabla:"no_table",
// 						min_occ:5,
// 						sfecha:true,
// 						val_process:false,
// 						idtime:1550259502248,
// 						level_req:"single",
// 						with_data_freq:false,
// 						with_data_score_cell:false,
// 						with_data_freq_cell:false,
// 						with_data_score_decil:false,
// 						discardedFilterids:[],
// 						tfilters: pars[0]
// 					}
// 			).expect("Content-type",/json/)
// 			.expect(200)
// 			.end(function(err, response){
// 	            response.statusCode.should.equal(200)
// 	            expect(response.body.data).to.not.equal(null)
// 	            expect(response.body.data).all.have.property("spid")
// 	            expect(response.body.data).all.have.property("tipo")
// 	            expect(response.body.data).all.have.property("reinovalido")
// 	            expect(response.body.data).all.have.property("phylumdivisionvalido")
// 	            expect(response.body.data).all.have.property("clasevalida")
// 	            expect(response.body.data).all.have.property("familiavalida")
// 	            expect(response.body.data).all.have.property("generovalido")
// 	            expect(response.body.data).all.have.property("familiavalida")
// 	            expect(response.body.data).all.have.property("especievalidabusqueda")
// 	            expect(response.body.data).all.have.property("cells")
// 	            expect(response.body.data).all.have.property("ni")
// 	            expect(response.body.data).all.have.property("nij")
// 	            expect(response.body.data).all.have.property("n")
// 	            expect(response.body.data).all.have.property("epsilon")
// 	            expect(response.body.data).all.have.property("score")
// 				done();
// 			})

// 		});

// 	});
// });

// describe("verbo getVariables", function(){
	
// 	it("verbo getVariables - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/especie/getVariables")
// 		.send({
// 			  	field:"phylumdivisionvalido",
// 			  	parentfield:"especievalidabusqueda",
// 			  	parentitem:"Lynx rufus",
// 				footprint_region:1
// 			})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.data).all.have.property("name")
// 			expect(response.body.data).all.have.property("spp")
// 			done();
// 		});
// 	});

// });

// describe("verbo getIdFromName", function(){
	
// 	it("verbo getIdFromName - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/especie/getIdFromName")
// 		.send({
// 				"species":["Lynx rufus"]
// 			})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.species).all.have.property("species_found")
// 			expect(response.body.species).all.have.property("ids")
// 			done();
// 		});
// 	});
	
// });

// describe("verbo getAvailableVariables", function(){
	
// 	it("verbo getAvailableVariables - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/especie/getAvailableVariables")
// 		.send({
//  			 	field:"bio001",
//   				level:0,
//   				footprint_region:1
// 			})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.data).all.have.property("fuente")
// 			expect(response.body.data).all.have.property("id")
// 			expect(response.body.data).all.have.property("descripcion")
// 			done();
// 		});
// 	});
	
// });

// describe("verbo getSubAOI", function(){
	
// 	it("verbo getSubAOI - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/especie/getSubAOI")
// 		.send({})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.data).all.have.property("footprint_region")
// 			expect(response.body.data).all.have.property("country")
// 			expect(response.body.data).all.have.property("fgid")
// 			done();
// 		});
// 	});
	
// });

// describe("verbo getValuesFromToken", function(){
	
// 	it("verbo getValuesFromToken - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/especie/getValuesFromToken")
// 		.send({
// 				"token":"fef646b3d8248ddf191d3e908261cefb",
// 				"tipo":"nicho"
//              })
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.data).all.have.property("parametros")
// 			done();
// 		});
// 	});
	
// });

// describe("verbo getAvailableCountriesFootprint", function(){
	
// 	it("verbo getAvailableCountriesFootprint - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/especie/getAvailableCountriesFootprint")
// 		.send({})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.data).all.have.property("footprint_region")
// 			expect(response.body.data).all.have.property("country")
// 			expect(response.body.data).all.have.property("fgid")
// 			done();
// 		});
// 	});
	
// });

// describe("verbo getNodes", function(){
	
// 	it("verbo getNodes - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/getNodes")
// 		.send({
// 	              qtype:"getNodes",
// 	              s_tfilters:[
// 	                  {
// 	                      field:"generovalido",
// 	                      value:"Lynx",
// 	                      type:0,
// 	                      parent:"",
// 	                      fGroupId:1,
// 	                      grp:0
// 	                  }
// 	              ],
// 	              t_tfilters:[
// 	                  {
// 	                      field:"especievalidabusqueda",
// 	                      value:"Aedes aegypti",
// 	                      type:0,
// 	                      parent:"",
// 	                      fGroupId:2,
// 	                      grp:1
// 	                  }
// 	              ],
// 	              hasbiosource:true,
// 	              hasrastersource:false,
// 	              hasbiotarget:true,
// 	              hasrastertarget:false,
// 	              min_occ:5,
// 	              grid_res:"16",
// 	              footprint_region:1
// 	        })
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.data).to.not.equal(null)
//             expect(response.body.data).all.have.property("spid")
//             expect(response.body.data).all.have.property("reinovalido")
//             expect(response.body.data).all.have.property("phylumdivisionvalido")
//             expect(response.body.data).all.have.property("clasevalida")
//             expect(response.body.data).all.have.property("familiavalida")
//             expect(response.body.data).all.have.property("generovalido")
//             expect(response.body.data).all.have.property("familiavalida")
//             expect(response.body.data).all.have.property("label")
//             expect(response.body.data).all.have.property("occ")
// 			done();
// 		});
// 	});
	
// });

// describe("verbo getEdges", function(){
	
// 	it("verbo getEdges - DISPONIBLE", function(done){

// 		supertest(server).post("/niche/getEdges")
// 		.send({
//                       "qtype":"getEdges",
//                       "s_tfilters":[
//                           {
//                               "field":"generovalido",
//                               "value":"Lynx",
//                               "type":0,
//                               "parent":"",
//                               "fGroupId":1,
//                               "grp":0
//                           }
//                       ],
//                       "t_tfilters":[
//                           {
//                               "field":"especievalidabusqueda",
//                               "value":"Aedes aegypti",
//                               "type":0,
//                               "parent":"",
//                               "fGroupId":2,
//                               "grp":1
//                           }
//                       ],
//                       "hasbiosource":true,
//                       "hasrastersource":false,
//                       "hasbiotarget":true,
//                       "hasrastertarget":false,
//                       "ep_th":0,
//                       "min_occ":5,
//                       "grid_res":"16",
//                       "footprint_region":1
//                   })
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, response){
// 			response.statusCode.should.equal(200)
// 			expect(response.body.data).to.not.equal(null)
//             expect(response.body.data).all.have.property("source")
//             expect(response.body.data).all.have.property("target")
//             expect(response.body.data).all.have.property("ni")
//             expect(response.body.data).all.have.property("nj")
//             expect(response.body.data).all.have.property("nij")
//             done();
// 		});
// 	});
	
// });


// **************************************************************************************************************

// describe("Test cells endpoint",function(){
// 	var last_cells_size = 0;

// 	it("Should return a 200 response", function(done){

// 		supertest(server).post("/niche/cells")
// 		.send({})
// 		.expect("Content-type",/json/)
// 		.expect(200, done);
// 	});

// 	it("Should respond with a listening message", function(done){

// 		supertest(server).post("/niche/cells")
// 		.send({})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, res) {
// 			expect(res.body).to.have.property("msg");
// 			expect(res.body.msg).to.equal("cells endpoint listening")
// 			done();
// 		})
// 	});

// 	it("Should get resolution of 16km as default", function(done){
// 		var spid = 28923;

// 		supertest(server).post("/niche/cells")
// 		.send({
// 			sp_id : spid
// 		})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, res){
// 			expect(res.body).to.have.property("cells_col")
// 			expect(res.body.cells_col).to.equal("cells_16km")
// 			done();
// 		})

// 	});

// 	it("Should get the cells containing a given species at default resolution", function(done){
// 		var spid = 28923;

// 		supertest(server).post("/niche/cells")
// 		.send({
// 			sp_id : spid
// 		})
// 		.expect("Content-type",/json/)
// 		.expect(200)
// 		.end(function(err, res){
// 			expect(res.body).to.have.property("data")
// 			expect(res.body.data).to.not.equal(null)
// 			expect(res.body).to.have.property("cells_col")
// 			expect(res.body.cells_col).to.equal("cells_16km")
// 			expect(res.body.data).to.have.property("cell_ids")
// 			expect(res.body.data.cell_ids).to.be.an("array")
// 			expect(res.body.data.cell_ids).to.have.length.above(0)
// 			done();
// 		})

// 	});

// 	[8, 16, 32, 64].forEach(value => {
// 		it("Should get the cells containing a given species at res " + value + " km", function(done){
// 			var spid = 28923;

// 			supertest(server).post("/niche/cells")
// 			.send({
// 				sp_id: spid,
// 				cells_res: value
// 			})
// 			.expect("Content-type",/json/)
// 			.expect(200)
// 			.end(function(err, res){
// 				expect(res.body).to.have.property("data")
// 				expect(res.body.data).to.not.equal(null)
// 				expect(res.body.data).to.be.an("array")
// 				expect(res.body.data).to.have.length.equal(1)
// 				expect(res.body).to.have.property("cells_col")
// 				expect(res.body.cells_col).to.equal("cells_" + value + "km")
// 				expect(res.body.data).to.have.property("cell_ids")
// 				expect(res.body.data.cell_ids).to.be.an("array")
// 				expect(res.body.data.cell_ids).to.have.length.above(0)
// 				done();
// 			})
// 		});
// 	});

// 	var niveles_tax = [ 
// 		["generovalido", "Panthera"]];

// 	niveles_tax.forEach(pair => {
// 		it("Should get the cells for " + pair, function(done){

// 			supertest(server).post("/niche/cells")
// 			.send({
// 				tax_level: pair[0],
// 				tax_name: pair[1]
// 			})
// 			.expect("Content-type",/json/)
// 			.expect(200)
// 			.end(function(err, res){
// 				expect(res.body).to.have.property("cells_col")
// 				expect(res.body.cells_col).to.equal("cells_16km")
// 				expect(res.body).to.have.property("data")
// 				expect(res.body.data).to.have.property("cell_ids")
// 				expect(res.body.data.cell_ids).to.be.an("array")
// 				expect(res.body.data.cell_ids).to.have.length.above(0)
// 				done();
// 			})
// 		});
// 	});
// });
