# SNIB Middleware

This NodeJS application provides the functionality needed by the [SPECIES][sp]
plataform. SNIB Middleware is an API where all functionality of [SPECIES][sp]
is implemented, so it is also consumable from another systems beside our
application, e.g. Python or R.

SNIB Middleware assumes that you have created a DB using
[speciesDBBuild](https://bitbucket.org/conabio_c3/speciesdbbuild).

## Installation

SNIB Middleware requires [NodeJS][nodejs] version 6.x.

On MacOS, [NodeJS][nodejs] can be installed via [Brew][brew]. It is also
possible to install [NodeJS][nodejs] on other systems, please see
[Installing Node.js via package manager][node-package-managers].

### MacOS and [Brew][brew] installation

Open a terminal and run

```x-sh
$ brew install node@6
```

If there is a prevoius [NodeJS][nodejs] installation execute the
following commands in a Terminal

```x-sh
$ brew unlink node
$ brew install node@6
$ brew link node@6
```

After a [NodeJS][nodejs] sucessful installation, clone the SNIB Middleware
application repository

```x-sh
$ git clone https://bitbucket.org/conabio_c3/snib-middleware.git
```

and install the application and its dependencies.

```x-sh
$ cd snib-middleware
$ npm install
```

## Use

Before to start using SNIB Middleware, we have to edit the `config.js` file.
Open `config.js` on a text editor and write your connection information for
the database

```javascript
config.db.database = myawesomedb
config.db.user = admin
config.db.password = admin123
config.db.host = localhost
config.db.port = 5352
```

and the email configuration

```javascript
config.email.user = xxxxx@xxx.com
config.email.pass = passwordemail
config.email.host = localhost
config.email.port = port
````


or add the following variable to you environment:

- DBNAME
- DBUSER
- DBPWD
- DBHOST
- DBPORT
- EUSER
- EPASS
- EHOST
- EPORT

On MacOS we can do this in a Terminal as follows

```x-sh
$ export DBNAME=myawesomedb
$ export DBUSER=admin
$ export DBPWD=admin123
$ export DBHOST=localhost
$ export DBPORT=5352
$ export EUSER=xxxxx@xxx.com
$ export EPASS=passwordemail 
$ export EHOST=localhost
$ export EPORT=myport
```

After edit the `config.js` file, the application can be started executing

```x-sh
$ npm start
```

from a Terminal.

By default SNIB Middleware runs on port 8080, so we can test if the Middleware
is running from another terminal executing

```
$ curl http://localhost:8080/niche/
```

To stop SNIB Middleware, press `CTRL+C` from the Terminal where it is running.

## Contributing

SNIB Middleware is an Open Source development AGPLV3 licensed. Therefore is
open to contribution and adaptations.

Any change can be send to this repository via a pull request. Before create
a pull request run the command `npm run lint` to verify lint your code.

Use of the `console.log` function is discourage, a module debugger is
recommended.

[sp]: http://species.conabio.gob.mx/
[node-package-managers]: https://nodejs.org/en/download/package-manager/
[brew]: https://brew.sh/
[nodejs]: https://nodejs.org/en/
