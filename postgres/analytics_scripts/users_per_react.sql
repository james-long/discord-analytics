SELECT	svr.server_id,
		svr.name AS server_name,
		usr.user_id,
		usr.name AS user_name,
		usr.nickname,
		usr.nickname_id,
		usr.avatar_url,
		chan.channel_id,
		chan.name AS channel_name,
		chan.type AS channel_type,
		COUNT(DISTINCT msg.message_id) AS message_count
FROM (
    SELECT *
    FROM users
    WHERE server_id = $1
        AND user_id LIKE $2
)   AS usr
CROSS	JOIN LATERAL (
	SELECT	*
	FROM	channels AS chan
	WHERE	chan.server_id = usr.server_id
		AND	chan.type = 'text'
)	AS chan
LEFT	JOIN messages AS msg
	ON	usr.user_id = msg.author_id
	AND	chan.channel_id = msg.channel_id
	AND	usr.server_id = msg.server_id
LEFT	JOIN servers svr
	ON	usr.server_id = svr.server_id
	AND	usr.server_id = svr.server_id
GROUP	BY	svr.server_id,
			server_name,
			user_name,
			usr.user_id,
			usr.nickname,
			usr.nickname_id,
			usr.avatar_url,
			chan.channel_id,
			channel_name,
			channel_type
ORDER	BY	svr.server_id,
			usr.user_id,
			chan.channel_id