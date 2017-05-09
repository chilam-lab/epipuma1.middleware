var request = require('supertest')

describe('verificacion que la rutas funcionen', 
  function () {
    var server
    
    beforeEach(function () {
      delete require.cache[require.resolve('../server')]
      server = require('../server')
    })
    
    afterEach(function (done) {
      server.close(done)
    })
    
    describe('revisar la raiz del middleware /snib/', function () {
      it('revisa que conteste raiz con el mensaje de bienvenida', 
        function testSlash(done) {
          request(server)
            .get('/snib/')
            .expect('Content-Type', /json/)
            .expect(200, {
              data: {message: '¡Yey! Bienvenido al API de SNIB'}
            }, done)
        })
    })
    
    describe('revisar el verbo getGridIds del middleware', function () {
      it('no se debe de responder al metodo POST', 
        function testSlash(done) {
          request(server)
            .post('/snib/getGridIds')
            .expect(404, 'Cannot POST /snib/getGridIds\n', done)
        })
    })
    
    it('404 para las demas rutas', function testPath(done) {
      request(server)
        .get('/foo/bar')
        .expect(404, done)
    })
  }
)
