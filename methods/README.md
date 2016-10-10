  - [getParam()](#getparamreqexpressrequestnamestringdefaultvaluemixed)
  - [exports.getGridIds()](#exportsgetgrididsreqexpressrequestresexpressresponse)
  - [exports.getSpecie()](#exportsgetspeciereqexpressrequestresexpressresponse)

## getParam(req:express.Request, name:String, [defaultValue]:Mixed)

  Return the value of param `name` when present or `defaultValue`.
  
   - Checks body params, ex: id=12, {"id":12}
   - Checks query string params, ex: ?id=12
  
  To utilize request bodies, `req.body`
  should be an object. This can be done by using
  the `bodyParser()` middleware.

## exports.getGridIds(req:express.Request, res:express.Response)

  GetGridIds de SNIB DB
  
  Responde los valores de los ids de las celdas donde se calculan
  los indices.

## exports.getSpecie(req:express.Request, res:express.Response)

  getSpecie regresa la clasificación de las especies relacionadas
  a la cadena `nom_sp`. 
  
  Responde la calasificación de las especies que están relacionadas con 
  una cadena enviada, `nom_sp`, o algunas si no se envia cadena o la 
  cadena es vacia. Además se acepta el parámetro `limit`.
