// Given an object representing a single row of data, casts all dates to millisecond values
let validate = function(input){
    Object.keys(input).forEach((key) => {
        if(input[key] !== null && typeof(input[key]) === 'object'){
            // It is probably a Date
            try{
                input[key] = input[key].getTime();
            } catch(err){
                console.error(`The data in the column was some non-date object: ${err}`);
            }
        }
    });
    return input;
};

let jsonifyResult = function(queryAlias, result){
    let obj = [];
    for(row of result.rows){
        obj.push(validate(row));
    }
    return JSON.stringify(obj);
};

exports.jsonify_query = async function(postgresClient, queryAlias, query, params = []){
    try{
        var res = await postgresClient.query(query, params);
    } catch(err){
        console.error(`Error with query ${queryAlias}. 
        query: ${query}
        params: ${params}
        error: ${err}`);
    }
    return jsonifyResult(queryAlias, res);
};