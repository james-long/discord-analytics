const { Client } = require('pg');

const setupPostgres = async (postgresAuth) => {
    console.log("Connecting to Postgres client...");
    const postgresClient = new Client(postgresAuth);
    await postgresClient.connect();
    console.log("Postgres client connected!");
    return postgresClient;
};

module.exports = { setupPostgres };