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
            // Store globally
            config = JSON.parse(config);
            var globalConfig = config;

            // Populate dropdown
            let dropdown = $('.server-dropdown');
            let servers = JSON.parse(config.servers);
            servers.forEach((serverObj) => {
                dropdown.append(
                    $('<option></option>')
                        .text(serverObj.name)
                        .attr('data-server', serverObj.server_id)
                );
            });
            dropdown.change(() => {createGraphs(globalConfig);});

            // First-time graph creation
            createGraphs(globalConfig);
        })
        .fail((xhr, status, err) => {
            $("p").text(err);
        });
});

function createGraphs(config){
    let dropdownSelection = $('.server-dropdown option:selected').attr('data-server');
    d3drop_linegraph();
    d3drop_bargraph();
    d3create_linegraph(config, dropdownSelection);
    d3create_bargraph(config, dropdownSelection);
}