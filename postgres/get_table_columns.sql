SELECT	table_catalog AS server,
		table_schema,
		table_name,
		column_name,
		ordinal_position AS order,
		data_type
FROM 	information_schema.columns
WHERE 	table_schema = 'public'
ORDER	BY column_name