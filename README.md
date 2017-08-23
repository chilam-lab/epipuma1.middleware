# SNIB Middleware

Esta aplicación es responsable de crear el API necesaria para [SPECIES][sp].

En `docs/api-doc.md` se puede consultar la documentación de la API.

## Instalación y uso

La instalación requiere node versión 6. 

En el caso de macOS, node se puede instalar mediante [brew][brew]. Para otros sistemas consultar la documentación en [Installing Node.js via package manage][node-package-managers].

### Instalación con [brew][brew]

Si node no está instalado:

```
  $ brew install node@6
```

Si node está instalado con una versión mayor:

```
  $ brew unlink node
  $ brew install node@6
  $ brew link node@6
```

Si `brew link node@6` no funciona, es posible que se requiera usar `--force` para crear la liga:

```
  $ brew link --force node@6
```



Clonar el repositorio

```
  $ git clone https://bitbucket.org/conabio_c3/snib-middleware.git
```

Para instalar la aplicación

```
  $ cd snib-middleware
  $ npm install
```

### Uso

Una vez instalada

```
  $ npm start
```

>  _Nota:_ Hay que conifgurar la conexión a la base de datos en el archivo 
>  `config.js`.

## Desarrollo

Cuando se esté desarrollando nuevos endpoints para la API se recomienda 
documentarlos en el archivo `api/swagger/swagger.yaml`, esto se 
puede hacer con cualquier editor de texto o con el editor de [Swagger][swagger].
Después de documentar el nuevo endpoint se puede usar el comando 
`npm run api-docs` para generar el nuevo archivo de documentación
del API y `npm run docs` para documentar los controladores. 

Se recomienda antes de hacer un push al repositorio correr el comando
`npm run lint` para respetar la escritura del código.

Se recomienda usar un debugger sobre `console.log`, en cada uno de los archivos
de controladores deben de tener un debugger.

[sp]: http://species.conabio.gob.mx/ 
[swagger]: http://swagger.io/
[node-package-managers]: https://nodejs.org/en/download/package-manager/
[brew]: https://brew.sh/
