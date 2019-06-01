require('require-sql');

exports.getQueryByAlias = function (queryAlias){
    return require(`../../postgres/analytics_scripts/${queryAlias}.sql`);
};