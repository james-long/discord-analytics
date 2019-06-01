const {
    discord: discordAuth,
    postgres: postgresAuth
} = require('./auth.json');

postgresInit = require('./postgres/init');
postgresClient = postgresInit.authenticate(postgresAuth);

discordInit = require('./discord/init');
discordInit.setup(discordAuth, postgresClient);

expressInit = require('./express/init');
expressInit.setup(postgresClient);