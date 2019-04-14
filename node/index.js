const {discord: discordAuth, postgres: postgresAuth} = require('./auth.json');

const Discord = require('discord.js');
const Postgres = require('pg');
const Express = require('express');

const {getData_messages, getData_servers} = require('./pg-manager.js');
const {jsonify_query} = require('./pg-jsonify-query.js');
const {getQueryByAlias} = require('./query-dictionary.js');
const Messenger = require('./messenger');

const discordClient = new Discord.Client();
const postgresClient = new Postgres.Client(postgresAuth);
const expressClient = Express();

// Set up relevant connections
try{
    postgresClient.connect();
} catch(err){
    console.error(`Postgres connection failed: ${err}`);
}
try{
    discordClient.login(discordAuth.token);
} catch(err){
    console.error(`Discord connection failed: ${err}`);
}

// Discord bot events

discordClient.on("ready", () => {
    console.log("Analytics Bot is now online!");
});

discordClient.on("message", async (message) => {
    if (message.content.startsWith("!pull")) {
        let server = message.channel.guild;
        let start_timestamp = new Date();
        try {
            const progressEmbed = new Messenger.ProgressUpdate(message.channel);
            await progressEmbed.sendInitialMessage();
            await getData_messages(server, progressEmbed, postgresClient);
            await getData_servers(server, progressEmbed, postgresClient);
        } catch(err){
            console.error(`Issue occurred somewhere in the data pull and insertion chain: ${err}`);
        }
        // Remove all past records of this server and re-insert a fresh copy
        try {
            await postgresClient.query('DELETE FROM public.existing_servers WHERE server_id = $1', [server.id]);
            await postgresClient.query('INSERT INTO public.existing_servers VALUES($1)', [server.id]);
        } catch(err){
            console.error(`existing_servers deletion/insertion failed: ${err}`);
        }
        console.log(`[${new Date().toUTCString()}] Insertion of all records for ${server.name} complete!`);
        let end_timestamp = new Date();
        console.log(`Total time taken: ${(end_timestamp - start_timestamp)/1000.0} seconds.`);
    }
});

// Express endpoints

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
    let data = await jsonify_query(postgresClient, req.body.queryAlias, getQueryByAlias(req.body.queryAlias));
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

expressClient.listen(3000, () => console.log('Express app listening on port 3000!'));
