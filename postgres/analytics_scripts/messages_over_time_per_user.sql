SELECT	svr.server_id,
		svr.name AS server_name,
		usr.user_id,
		usr.name AS user_name,
		usr.nickname,
		usr.nickname_id,
		usr.avatar_url,
		dates.date,
		COUNT(DISTINCT msg.message_id) AS message_count
FROM	servers svr
LEFT	JOIN users usr
	ON	svr.server_id = usr.server_id
CROSS	JOIN LATERAL(
	WITH	minmax AS(
		SELECT	MIN(date_trunc('day', created_date)) AS min_date,
				MAX(date_trunc('day', created_date)) AS max_date
		FROM	messages
		WHERE	server_id = svr.server_id
	)
	SELECT	generate_series AS date
	FROM	generate_series(
		(SELECT min_date FROM minmax)::date,
		(SELECT max_date FROM minmax)::date,
		'1 day'::interval
	)
)	AS dates
LEFT	JOIN messages msg
	ON	msg.server_id = svr.server_id
	AND	msg.author_id = usr.user_id
	AND	date_trunc('day', msg.created_date) =date_trunc('day', dates.date)
GROUP	BY	svr.server_id,
			server_name,
			usr.user_id,
			user_name,
			usr.nickname,
			usr.nickname_id,
			usr.avatar_url,
			dates.date
ORDER	BY	svr.server_id,
			usr.user_id,
			dates.date