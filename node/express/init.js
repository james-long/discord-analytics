const Express = require('express');
const expressClient = Express();
const {jsonify_query} = require('../postgres/pg-jsonify-query.js');
const {getQueryByAlias} = require('../postgres/query-dictionary.js');

const setupExpress = (postgresClient) => {
    // Middleware
    // allow CORS (in development, both the site and server use different localhost ports)
    expressClient.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', '*');
        next();
    });

    // Process post request additional data
    expressClient.use(
        Express.json()
    );

    // Routes
    expressClient.post('/', async (req, res) => {   // Generic query handler
        let data = await jsonify_query(postgresClient, req.body.queryAlias,
            getQueryByAlias(req.body.queryAlias), req.body.params);
        res.send(data);
    });
    expressClient.get('/config/', async (req, res) => {   // Config query handler
        let data = {
            channels: await jsonify_query(postgresClient, 'config_channels', 'SELECT * FROM channels'),
            users: await jsonify_query(postgresClient, 'config_channels', 'SELECT * FROM users'),
            roles: await jsonify_query(postgresClient, 'config_channels', 'SELECT * FROM roles'),
            servers: await jsonify_query(postgresClient, 'config_channels', 'SELECT * FROM servers')
        };
        res.send(JSON.stringify(data));
    });

    expressClient.listen(4000, () => console.log('Express app listening on port 4000!'));
};

module.exports = { setupExpress };