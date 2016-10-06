var request = require('supertest');
describe('Loading snib app', function () {
  var server;
  beforeEach(function () {
    delete require.cache[require.resolve('../server')];
    server = require('../server');
  });
  afterEach(function (done) {
    server.close(done);
  });
  it('responds to /snib/', function testSlash(done) {
  request(server)
    .get('/snib/')
    .expect('Content-Type', /json/)
    .expect(200, {
      data: {message: '¡Yey! Bienvenido al API de SNIB'}
    }, done);
  });
  it('404 everything else', function testPath(done) {
    request(server)
      .get('/foo/bar')
      .expect(404, done);
  });
});
