const Postgres = require('pg');

function authenticate(postgresAuth){
    const postgresClient = new Postgres.Client(postgresAuth);

    try{
        postgresClient.connect();
    } catch(err){
        console.error(`Postgres connection failed: ${err}`);
    }

    return postgresClient;
}

module.exports = { authenticate };