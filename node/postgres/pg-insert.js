require('require-sql');
const configQuery = require('../../postgres/get_table_columns.sql');

/*  pg-insert.js
    Contains flexible pgInsert function to insert to public schema tables.
    A table name & an array of objects matching the table definition must be passed in.
    This will be checked in the function.
*/

// Use pre-constructed config query to determine table properties
async function pgConfig(postgresClient, tableName) {
    try{
        var res = await postgresClient.query(configQuery);
    } catch(err){
        console.error(`Postgres table config query failed: ${err}`);
    }
    return res.rows.filter(obj => obj.table_name === tableName);
}

// Add $ in front of index for parameterized insert, with additional modifications based on data type
function validate(idx, type){
    if(type.includes('timestamp')){
        return `to_timestamp($${idx}/1000.0)`; // Convert ms to s, then format for Postgres
    }
    else{
        return `$${idx}`;
    }
}

// toInsert should be an array of objects containing the relevant column names
exports.pgInsert = async (pgClient, serverID, tableName, toInsert) => {
    if(toInsert.length === 0) {
        console.log(`[${new Date().toUTCString()}] No data available for public.${tableName}. Skipping.`);
        return;
    }

    // Clear out table on a server-basis before insertion
    try {
        var serverRes = await pgClient
            .query(`SELECT * FROM public.existing_servers WHERE server_id = $1`, [serverID]);
    } catch(err){
        console.error(`existing_servers table query failed: ${err}`);
    }
    if(serverRes.rowCount > 0){
        try{
            await pgClient.query(`DELETE FROM public.${tableName} WHERE server_id = $1`, [serverID]);
        } catch(err){
            console.error(`${tableName} table query failed: ${err}`);
        }
        console.log(`[${new Date().toUTCString()}] Existing records in public.${tableName} from this server deleted.`);
    }

    // Pull relevant config for the table in question: the columns will be sorted (specified in the SQL query)
    let config = await pgConfig(pgClient, tableName);

    // Create aggregated column name and placeholder ($1, $2, etc.) strings
    let colNames = config.reduce((acc, cur) => {
        return {'column_name': acc.column_name + ',' + cur.column_name};
    }).column_name;
    let colParams = config.reduce((acc, cur, idx) => {
        return `${acc},${validate(idx + 1, cur.data_type)}`;
    }, '').substring(1); // Remove leading comma

    console.log(`[${new Date().toUTCString()}] Preparing to insert data to public.${tableName}.`);
    // Insert data row-by-row
    for(data of toInsert) {
        // Create array of values based on sorted keys
        params = Object.keys(data).sort().map(col => {
            return typeof(data[col]) === 'string' ? data[col].replace(/\0/g, '') : data[col];
        });
        let query = `INSERT INTO ${tableName}(${colNames}) VALUES(${colParams});`;

        try{
            await pgClient.query(query, params);
        } catch(err){
            console.error(`${tableName} table insert failed: ${err}`);
        }
    }
    console.log(`[${new Date().toUTCString()}] Insertion to public.${tableName} complete. Inserted ${toInsert.length} rows.`);
};