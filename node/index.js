const {discord: discordAuth, postgres: postgresAuth} = require('./auth.json');

const Discord = require('discord.js');
const Postgres = require('pg');

const {getAllMessageData} = require('./discord-pull.js');
const {pgInsert} = require('./pg-insert.js');

const discordClient = new Discord.Client();
const postgresClient = new Postgres.Client(postgresAuth);

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

discordClient.on("ready", () => {
    console.log("Analytics Bot is now online!");
});

discordClient.on("message", async (message) => {
    if (message.content.startsWith("!messages")) {
        let server = message.channel.guild;
        let start_timestamp = new Date();
        await getData_messages(server);
        await getData_servers(server);
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

/*  Data pertinent to messages: fills the tables:
        messages
        message_attachments
        message_reactions
        message_mentions
*/
async function getData_messages(server){
    let allMessages = await getAllMessageData(server);

    // messages
    let payload_messages = [];
    for (let [channel_id, data] of allMessages.entries())
    {
        for ([message_id, msg_data] of data.entries()){
            let obj = {
                'message_id': message_id,
                'server_id': server.id,
                'channel_id': channel_id,
                'author_id': msg_data.author.id,
                'message': msg_data.content,
                'created_date': msg_data.createdTimestamp,
                'modified_date': msg_data.editedTimestamp
            };
            payload_messages.push(obj);
        }
    }
    await pgInsert(postgresClient, server.id, 'messages', payload_messages);

    // message_attachments
    let payload_message_attachments = [];
    for (let [channel_id, data] of allMessages.entries())
    {
        for ([message_id, msg_data] of data.entries())
        {
            if(msg_data.attachments.size !== 0)
            {
                for([attachment_id, attachment_data] of msg_data.attachments.entries())
                {
                    let obj = {
                        'message_id': message_id,
                        'server_id': server.id,
                        'attachment_id': attachment_id,
                        'attachment_url': attachment_data.url
                    };
                    payload_message_attachments.push(obj);
                }
            }
        }
    }
    await pgInsert(postgresClient, server.id, 'message_attachments', payload_message_attachments);

    // message_reactions
    let payload_message_reactions = [];
    for (let [channel_id, data] of allMessages.entries())
    {
        for ([message_id, msg_data] of data.entries())
        {
            if(msg_data.reactions.size !== 0)
            {
                for([reaction_key, reaction_data] of msg_data.reactions.entries())
                {
                    let obj = {
                        'message_id': message_id,
                        'server_id': server.id,
                        'reaction_id': reaction_data.emoji.id,
                        'reaction_name': reaction_data.emoji.name,
                        'reaction_count': reaction_data.count
                    };
                    payload_message_reactions.push(obj);
                }
            }
        }
    }
    await pgInsert(postgresClient, server.id, 'message_reactions', payload_message_reactions);

    // message_mentions
    let payload_message_mentions = [];
    for (let [channel_id, data] of allMessages.entries())
    {
        for ([message_id, msg_data] of data.entries())
        {
            if(msg_data.mentions.roles.size !== 0)
            {
                for([role_id, role_data] of msg_data.mentions.roles.entries())
                {
                    let obj = {
                        'message_id': message_id,
                        'server_id': server.id,
                        'mention_type': 'role',
                        'mention_id': role_id
                    };
                    payload_message_mentions.push(obj);
                }
            }
            if(msg_data.mentions.users.size !== 0)
            {
                for([user_id, user_data] of msg_data.mentions.users.entries())
                {
                    let obj = {
                        'message_id': message_id,
                        'server_id': server.id,
                        'mention_type': 'user',
                        'mention_id': user_id
                    };
                    payload_message_mentions.push(obj);
                }
            }
            if(msg_data.mentions.everyone)
            {
                let obj = {
                    'message_id': message_id,
                    'server_id': server.id,
                    'mention_type': 'everyone',
                    'mention_id': '0'
                };
                payload_message_mentions.push(obj);
            }
        }
    }
    await pgInsert(postgresClient, server.id, 'message_mentions', payload_message_mentions);
}

/*  Data pertinent to the server: fills the tables:
        servers
        channels
        roles
        users
        user_roles
*/
async function getData_servers(server){
    let {channels, members, roles} = server;

    // servers
    let payload_servers = [];
    let obj = {
        'server_id': server.id,
        'name': server.name,
        'icon_url': server.iconURL,
        'owner_id': server.ownerID,
        'member_count': server.member_count
    };
    payload_servers.push(obj);
    await pgInsert(postgresClient, server.id, 'servers', payload_servers);

    // channels
    let payload_channels = [];
    for([channel_id, channel_data] of channels.entries()){
        let obj = {
            'channel_id': channel_id,
            'server_id': server.id,
            'name': channel_data.name,
            'type': channel_data.type,
            'topic': channel_data.topic,
            'region': channel_data.region,
            'is_nsfw': channel_data.is_nsfw,
            'position': channel_data.position
        };
        payload_channels.push(obj);
    }
    await pgInsert(postgresClient, server.id, 'channels', payload_channels);

    // roles
    let payload_roles = [];
    for([role_id, role_data] of roles.entries()){
        let obj = {
            'role_id': role_id,
            'server_id': server.id,
            'name': role_data.name,
            'color': role_data.color,
            'permissions': role_data.permissions
        };
        payload_roles.push(obj);
    }
    await pgInsert(postgresClient, server.id, 'roles', payload_roles);

    // users
    let payload_users = [];
    for([user_id, user_data] of members.entries()){
        let obj = {
            'user_id': user_id,
            'server_id': server.id,
            'name': user_data.user.username,
            'nickname': user_data.nickname,
            'nickname_id': user_data.user.discriminator,
            'avatar_url': user_data.user.avatarURL,
            'joined_date': user_data.joinedTimestamp
        };
        payload_users.push(obj);
    }
    await pgInsert(postgresClient, server.id, 'users', payload_users);

    // user_roles
    let payload_user_roles = [];
    for([user_id, user_data] of members.entries()){
        for([role_id, role_data] of user_data.roles.entries()) {
            let obj = {
                'role_id': role_id,
                'server_id': server.id,
                'user_id': user_id
            };
            payload_user_roles.push(obj);
        }
    }
    await pgInsert(postgresClient, server.id, 'user_roles', payload_user_roles);
}