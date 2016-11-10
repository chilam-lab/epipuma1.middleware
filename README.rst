SNIB Middleware
===============

Esta aplicación es responsable de crear el API necesaria para SPECIES_.

En :code:`docs/api-doc.md` se puede consultar la documentación de la API.

Uso
---

Clonar el repositorio

.. code::
  
  $ git clone https://bitbucket.org/conabio_c3/snib-middleware.git

Después instalar la aplicación y lanzarla

.. code::
  
  $ cd snib-middleware
  $ npm install
  $ npm start

.. note:: Hay que conifgurar la conexión a la base de datos en el archivo 
  :code:`config.js`.

Desarrollo
----------

Cuando se esté desarrollando nuevos endpoints para la API se recomienda 
documentarlos en el archivo :code:`api/swagger/swagger.yaml`, esto se 
puede hacer con cualquier editor de texto o con el editor de Swagger_.
Después de documentar el nuevo endpoint se puede usar el comando 
:code:`npm run api-docs` para generar el nuevo archivo de documentación
del API. 

Se recomienda antes de hacer un push al repositorio correr el comando
:code:`npm run lint` para respetar la escritura del código.

Actualmente hay dos debugger, uno disponible en :code:`server.js` y otro
en :code:`controllers/verbs.js`, se recomienda usar estos sobre 
:code:`console.log`.

.. _SPECIES: http://species.conabio.gob.mx/ 
.. _Swagger: http://swagger.io/

