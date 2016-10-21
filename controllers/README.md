  - [getParam()](#getparamreqexpressrequestnamestringdefaultvaluemixed)
  - [exports.getGridIds()](#exportsgetgrididsreqexpressrequestresexpressresponse)
  - [exports.getSpeciesByName()](#exportsgetspeciesbynamereqexpressrequestresexpressresponse)
  - [exports.getSpecies()](#exportsgetspeciesreqexpressrequestresexpressresponse)
  - [exports.infoSpecie()](#exportsinfospeciereqexpressrequestresexpressresponse)

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

## exports.getSpeciesByName(req:express.Request, res:express.Response)

  getSpeciesByName regresa la clasificación de las especies relacionadas
  a la cadena `nom_sp`. 
  
  Responde la clasificación de las especies que están relacionadas con 
  una cadena enviada, `nom_sp`. Además se acepta el parámetro `limit`.

## exports.getSpecies(req:express.Request, res:express.Response)

  getSpecies regresa la clasificación de un número determinado de especies. 
  
  Responde la clasificación de un número determinado, `limit`, de especies.

## exports.infoSpecie(req:express.Request, res:express.Response)

  infoSpecie regresa GeoJson con las coordenadas de las ocurrencias de la
  especie además de información adicional sobre la información de las 
  observaciones.
