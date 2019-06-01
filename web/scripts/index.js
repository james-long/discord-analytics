/*  d3 functions:
    d3create_linegraph(config, server_id)
    d3create_bargraph(config, server_id)
 */

$(document).ready(() => {
    $.ajax({
        type: 'GET',
        url: 'http://localhost:3000/config',
        contentType: 'application/json'
    })
        .done((config) => {
            const parsedConfig = JSON.parse(config);

            populateDropdowns(parsedConfig);
            //createGraphs(parsedConfig);

            d3BarGraph = new BarGraph(parsedConfig);
            $('.heading-filter-selector-dropdown').change(() => {
                d3BarGraph.d3drop_bargraph();
                d3BarGraph.d3render_bargraph();
            });
        })
        .fail((xhr, status, err) => {
            console.log(err);
        });
});

function populateDropdowns(config){
    const servers = JSON.parse(config.servers);
    const serverDropdown = $('#server-dropdown');
    servers.forEach((serverObj) => {
        serverDropdown.append(
            $('<option></option>')
                .text(serverObj.name)
                .attr('data-server-id', serverObj.server_id)
        );
    });
    const curServerID = getSelectedServerID();

    const channels = JSON.parse(config.channels);
    const channelDropdown = $('#channel-dropdown');
    channelDropdown.append($('<option></option>').text('[NO FILTER]'));
    channels
        .filter((channelObj) => channelObj.server_id === curServerID)
        .forEach((channelObj) => {
        channelDropdown.append(
            $('<option></option>')
                .text(channelObj.name)
                .attr('data-channel-id', channelObj.channel_id)
        );
    });

    const users = JSON.parse(config.users);
    const userDropdown = $('#user-dropdown');
    userDropdown.append($('<option></option>').text('[NO FILTER]'));
    users
        .filter((userObj) => userObj.server_id === curServerID)
        .forEach((userObj) => {
            userDropdown.append(
                $('<option></option>')
                    .text(formatUsername(userObj.name, userObj.nickname, userObj.nickname_id))
                    .attr('data-user-id', userObj.user_id)
            );
        });
}

function createGraphs(config){
    d3drop_linegraph();
    d3create_linegraph(config);
}