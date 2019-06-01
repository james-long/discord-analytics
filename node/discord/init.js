const Discord = require('discord.js');
const Messenger = require('./messenger');
const discordClient = new Discord.Client();
const {getData_messages, getData_servers} = require('../postgres/pg-manager.js');

function setup(discordAuth, postgresClient){
    try{
        discordClient.login(discordAuth.token);
    } catch(err){
        console.error(`Discord connection failed: ${err}`);
    }

    createEvents(postgresClient);
}

function createEvents(postgresClient){
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
}

module.exports = { setup };