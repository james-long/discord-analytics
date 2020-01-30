const {
    discord: discordAuth,
    postgres: postgresAuth,
} = require('./auth.json');

const { setupPostgres } = require('./postgres/init');
const { setupDiscord } = require('./discord/init');
const { setupExpress } = require('./express/init');

const setup = async () => {
    console.log("======= Postgres Setup");
    const postgresClient = await setupPostgres(postgresAuth);
    console.log();
    console.log("======= Discord Setup");
    await setupDiscord(discordAuth, postgresClient);
    console.log();
    console.log("======= Express Setup");
    setupExpress(postgresClient);
    console.log();
};

setup().catch((err) => {
    console.log(`Error occurred during setup. ${err}`);
});