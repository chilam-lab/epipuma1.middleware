
var jwt = require("jsonwebtoken");
var SEED = require("../config").SEED;

// ===================================
// VERIFICAR TOKEN
// ===================================

exports.validaToken = function(req, res, next){

	var token = req.query.token;

	jwt.verify(token, SEED, function(err, decoded){

		if(err){
			return res.status(401)
					.send({
						ok: false,
						message: "Error, token no autorizado",
						errors: err
					});
		}

		// se obtiene el usaurio que realizo la petición
		req.usuarioRequest = decoded.usuario;
		next();

	});

}
