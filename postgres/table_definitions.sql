SET client_min_messages TO WARNING;	-- Suppress DROP TABLE IF EXISTS notices

-- TODO find out if message IDs are unique per server (probably not?)
-- Server, <existing PK> should be the new composite PK then
-- And truncation maybe shouldn't be done...!

DROP	TABLE IF EXISTS servers;
CREATE	TABLE servers(
	server_id TEXT NOT NULL PRIMARY KEY,
	name TEXT,
	icon_url TEXT,
	owner_id TEXT NOT NULL,
	member_count INT
);

DROP	TABLE IF EXISTS channels;
CREATE	TABLE channels(
	channel_id TEXT NOT NULL PRIMARY KEY,
	server_id TEXT NOT NULL,
	name TEXT,
	type TEXT,
	topic TEXT,
	region TEXT,
	is_nsfw BOOLEAN,
	position BIGINT
);

DROP	TABLE IF EXISTS messages;
CREATE	TABLE messages(
	-- Getting a lot of PK violations... could it be that Discord.js message IDs are not actually unique?
	-- Will leave like this for now, although message_id really should be a PK
	message_id TEXT NOT NULL, --PRIMARY KEY,
	server_id TEXT NOT NULL,
	channel_id TEXT NOT NULL,
	author_id TEXT NOT NULL,
	message TEXT,
	created_date TIMESTAMP WITH TIME ZONE,
	modified_date TIMESTAMP WITH TIME ZONE
);

DROP	TABLE IF EXISTS message_reactions;
CREATE	TABLE message_reactions(
	message_id TEXT NOT NULL,
	server_id TEXT NOT NULL,
	reaction_id TEXT,
	reaction_name TEXT,
	reaction_count INT
);

DROP	TABLE IF EXISTS message_mentions;
CREATE	TABLE message_mentions(
	message_id TEXT NOT NULL,
	server_id TEXT NOT NULL,
	mention_type TEXT,	-- User or role
	mention_id TEXT NOT NULL
);

DROP	TABLE IF EXISTS message_attachments;
CREATE	TABLE message_attachments(
	message_id TEXT NOT NULL,
	server_id TEXT NOT NULL,
	attachment_id TEXT NOT NULL,
	attachment_url TEXT
);

DROP	TABLE IF EXISTS users;
CREATE	TABLE users(
	user_id TEXT,
	server_id TEXT,
	name TEXT,
	nickname TEXT,
	nickname_id TEXT,
	avatar_url TEXT,
	joined_date TIMESTAMP WITH TIME ZONE
);

DROP	TABLE IF EXISTS user_roles;
CREATE	TABLE user_roles(
	role_id TEXT NOT NULL,
	server_id TEXT NOT NULL,
	user_id TEXT NOT NULL
);

DROP	TABLE IF EXISTS roles;
CREATE	TABLE roles(
	role_id TEXT NOT NULL,
	server_id TEXT NOT NULL,
	name TEXT NOT NULL,
	color TEXT NOT NULL, 	-- Should be hex, Discord has some of its own as well? 
							-- https://github.com/izy521/discord.io/blob/master/docs/colors.md
	permissions BIGINT NOT NULL -- Possibly change to an array of actual permissions later
);

DROP	TABLE IF EXISTS existing_servers;
CREATE	TABLE existing_servers(
	server_id TEXT NOT NULL
);

