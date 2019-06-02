class BarGraph{
    constructor(config){
        Object.keys(config).forEach((k) => config[k] = JSON.parse(config[k]));
        this.config = config;
        this.data = [];
        this.d3create_bargraph();
    }
    d3create_bargraph() {
        const config = this.config;
        $.ajax({
            type: 'POST',
            url: 'http://localhost:3000/',
            data: JSON.stringify({
                queryAlias: 'messages_per_member',
            }),
            contentType: 'application/json'
        })
            .done((data) => {
                this.data = JSON.parse(data);
                this.d3render_bargraph();
            })
            .fail((xhr, status, err) => {
                console.log(err);
            });
    }
    d3drop_bargraph(){
        // d3.select('.bar-graph').selectAll('*').remove();
    }

    d3render_bargraph(){
        const selected = {
            serverID: getSelectedServerID(),
            channelID: getSelectedChannelID(),
            userID: getSelectedUserID(),
        };

        const dataSet = this.data.filter((obj) => {
            return obj.server_id === selected.serverID
                && (!selected.channelID || obj.channel_id === selected.channelID)
                && (!selected.userID || obj.user_id === selected.userID);
        });

        const allUsers = this.config.users.filter((obj) =>
            obj.server_id === selected.serverID
            && (!selected.userID || obj.user_id === selected.userID));
        const allUsersMap = new Map();
        const userAxisNames = ['x'];
        let allUsersIter = 1;
        for(const user of allUsers){
            userAxisNames[allUsersIter] = formatUsername(user.name, user.nickname, user.nickname_id);
            if(!allUsersMap.has(user.user_id)){
                allUsersMap[user.user_id] = allUsersIter;
                allUsersIter++;
            }
        }
        const totalUsers = allUsersIter - 1;

        const allChannels = this.config.channels.filter((obj) =>
            obj.server_id === selected.serverID
            && (!selected.channelID || obj.channel_id === selected.channelID));
        const channelIdToName = {};
        const allChannelsMap = new Map();
        let allChannelsIter = 0;
        for(const channel of allChannels){
            channelIdToName[channel.channel_id] = channel.name;
            if(!allChannelsMap.has(channel.channel_id)){
                allChannelsMap[channel.channel_id] = allChannelsIter;
                allChannelsIter++;
            }
        }

        const c3data = [];
        Object.entries(allChannelsMap).forEach(([key, val]) => c3data[val] = [key]);
        for(const data of dataSet){
            c3data[allChannelsMap[data.channel_id]][allUsersMap[data.user_id]] = parseInt(data.message_count);
        }
        for(const entry of c3data){
            for(let i = 0; i <= totalUsers; i++){
                if(!entry[i]){
                    entry[i] = 0;
                }
            }
        }
        c3data.unshift(userAxisNames);

        c3.generate({
            bindto: '#bar-graph',
            data: {
                x: 'x',
                columns: c3data,
                type: 'bar',
                groups: [
                    Object.keys(allChannelsMap)
                ],
                names: channelIdToName,
            },
            grid: {
                y: {
                    lines: [{value:0}]
                }
            },
            axis : {
                x : {
                    type : 'category',
                },
            }
        });
    }

    // obj is an array of data objects
    old_d3render_bargraph(){
        const selected = {
            server_id: getSelectedServerID(),
            channel_id: getSelectedChannelID(),
            user_id: getSelectedUserID(),
        };
        const dataSet = this.data.filter((obj) => {
            return obj.server_id === selected.server_id
            && (!selected.channel_id || obj.channel_id === selected.channel_id)
            && (!selected.user_id || obj.user_id === selected.user_id);
        });
        const config = this.config;
        // We are only concerned with the users and channels for now, we change it to a map on ID
        const userConfig = JSON.parse(config.users)
            .reduce((acc, cur) => {
                return acc.set(cur.user_id, `${cur.name} #${cur.nickname_id}`);
            }, new Map());
        const channelConfig = JSON.parse(config.channels)
            .reduce((acc, cur) => {
                return acc.set(cur.channel_id, `#${cur.name}`);
            }, new Map());

        // Set up tooltip object to show/hide
        let tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .attr('z-index', 10)
            .style('visibility', 'hidden');

        // Various arrays containing unique entries (domains) of params of the dataset
        let uniqueUserIDs = dataSet.reduce((acc, cur) => {
            if(!acc.includes(cur.user_id)){
                return acc.concat([cur.user_id]);
            }
            return acc;
        }, []);
        let uniqueChannelIDs = dataSet.reduce((acc, cur) => {
            if(!acc.includes(cur.channel_id)){
                return acc.concat([cur.channel_id]);
            }
            return acc;
        }, []);

        // Split the data set into one array per user
        let userSplit = uniqueUserIDs.map((userID) => {
            return dataSet.filter((d) => {return d.user_id === userID});
        });
        userSplit.forEach((arr, idx, orig) => {
            orig[idx] = arr.reduce((acc, cur) => {
                acc[cur.channel_id] = +cur.message_count;
                return acc;// Create a key entry for the channel's message count
            }, { // User info consistent across all rows & a helpful auxillary function
                avatar_url: arr[0].avatar_url,
                nickname: arr[0].nickname,
                nickname_id: arr[0].nickname_id,
                server_id: arr[0].server_id,
                server_name: arr[0].server_name,
                user_id: arr[0].user_id,
                user_name: arr[0].user_name,
                getAllMessages: function() {
                    return uniqueChannelIDs.map((channelID) => {
                        return this[channelID];
                    }).reduce((acc, cur) => {return acc + cur});
                }
            });
        });
        // Apply an ascending sort to the array based on summed values
        userSplit.sort((x, y) => {
            return x.getAllMessages() - y.getAllMessages();
        });
        // Use d3 stack to convert into a format for stacked bars
        let userStack = d3.stack()
            .keys( // The channel IDs are the keys
                dataSet.reduce((acc, cur) => {
                    if(!acc.includes(cur.channel_id)){
                        return acc.concat([cur.channel_id]);
                    }
                    return acc;
                }, [])
            )
            (userSplit);

        /*  ==============
            CONFIG
            ==============
         */

        // svg object
        let svg = d3.select('.bar-graph');

        /*  Size variables */
        const svgConfig = {
            width: svg.attr('width'),
            height: svg.attr('height')
        };

        /*  Colour scheme */

        const colorScheme = d3.scaleOrdinal(d3.schemeCategory10);

        /*  Scales */
        // y scale
        // compute the array of all possible summed y-values
        const fullDomain = userSplit.map((d) => {
            return d.getAllMessages();
        });
        const yScale = d3.scaleLinear()
            .domain([d3.max(fullDomain), d3.min(fullDomain)]) // Reverse domain for axes to work
            .range([0, svgConfig.height]);
        // x scale
        const xScale = d3.scaleBand()
            .domain(userSplit.map((d) => {return d.user_id;})) // Ensure same sorting as the bars
            .range([0, svgConfig.width])
            .paddingInner(0.1)
            .paddingOuter(0.1);

        /*  Flags */
        // determines whether we have 'zoomed in' on a channel or not
        let zoomedIn = false;

        /*  ===================
            SVG Construction
            ===================
         */

        // one group per stack colour (in this case, per channel)
        let barGroups = svg.selectAll('g')
            .data(userStack)
            .enter()
            .append('g')
            .attr('data-channel', (d) => {return d.key;})
            .attr('fill', (d, i) => {return colorScheme(i);});

        // Append rects per group
        // data[0] is y0, data[1] is y
        barGroups.selectAll('rect')
            .data(d => d)
            .enter()
            .append('rect')
            .attr('x', (d) => {return xScale(d.data.user_id);})
            .attr('width', xScale.bandwidth())
            // Start with all bars at 0, we will transition
            .attr('y', svgConfig.height)
            .attr('height', 0);

        // Tooltip events
        barGroups.selectAll('rect')
            .on('mouseover', function (d) { // Arrow function does not bind 'this' !!
                let parentChannelID = d3.select(this.parentNode).attr('data-channel');
                let text = `User: ${d.data.user_name} #${d.data.nickname_id}\n`
                    + `Channel: ${channelConfig.get(parentChannelID)}\n`
                    + `Messages: ${d[1] - d[0]}`;
                return tooltip.style('visibility', 'visible')
                    .text(text);
            })
            .on('mousemove', () => {
                // Move tooltip with the mouse
                return tooltip.style('top', `${d3.event.pageY - 5}px`)
                    .style('left', `${d3.event.pageX + 5}px`);
            })
            .on('mouseout', () => {
                return tooltip.style('visibility', 'hidden');
            })
            .on('mousedown', function(d) {
                // If we are not zoomed in, filter for this channel only - else reset the zoom
                let currChannel = d3.select(this.parentNode).attr('data-channel');
                barChange(zoomedIn ? null : currChannel);
                zoomedIn = !zoomedIn;
            });

        // Transitions
        let barChange = function(category){
            let finalYScale = yScale;

            // Generate new y-scale factor based on remaining data
            if(category !== null){
                let domain;
                svg.selectAll(`g[data-channel='${category}']`)
                    .each((d) => {
                        domain = d.map((d) => {return d[1] - d[0]});
                    });
                console.log(domain);
                finalYScale = d3.scaleLinear()
                    .domain([d3.max(domain), d3.min(domain)]) // Reverse domain for axes to work
                    .range([0, svgConfig.height]);
            }

            barGroups.selectAll('rect')
                .transition()
                .duration(1000)
                .ease(d3.easeExp)
                .attr('y', function(d, i){
                    let thisChannel = d3.select(this.parentNode).attr('data-channel');
                    if(thisChannel === category){
                        return finalYScale(d[1] - d[0]);
                    }
                    else if(category === null){
                        return finalYScale(d[1]);
                    }
                    else{
                        // Consider the data being kept: if we are below, then go to 0. Else go to the height of the bar
                        // First retrieve the relevant data
                        let data;
                        d3.select(this.parentNode.parentNode)
                            .selectAll(`g[data-channel='${category}']`)
                            .each((d) => {
                                data = d[i];
                            });
                        let ownY = d3.select(this).attr('y'); // Our y-pos after scaling
                        if(ownY <= yScale(data[1])){ // Take care to use original scaling for this check
                            return finalYScale(data[1] - data[0]);
                        }
                        else{
                            return svgConfig.height;
                        }
                    }
                })
                .attr('height', function(d){
                    let thisChannel = d3.select(this.parentNode).attr('data-channel');
                    if(thisChannel === category){
                        return finalYScale(d[0]) - finalYScale(d[1]);
                    }
                    else if(category === null){
                        return finalYScale(d[0]) - finalYScale(d[1]);
                    }
                    else{
                        return 0;
                    }
                });

            svg.select('.y-axis')
                .transition()
                .duration(1000)
                .ease(d3.easeExp)
                .call(d3.axisLeft().scale(finalYScale));
        };

        barGroups.selectAll('rect')
            .transition()
            .duration(1000)
            .ease(d3.easeExp)
            .attr('y', (d) => {return yScale(d[1]);}) // the maximum value will map to 0 (highest point) via yScale
            .attr('height', (d) => {return yScale(d[0]) - yScale(d[1]);}); // y0 - y since y0 is 'higher' in an svg

        /*  axes */
        // y-axis
        svg
            .append('g')
            .call(d3.axisLeft().scale(yScale))
            .attr('class', 'y-axis');
        // x-axis
        svg
            .append('g')
            .call(d3.axisBottom()
                .scale(xScale)
                .tickFormat((d) => {return userConfig.get(d);}) // Display human-interpretable user info
            )
            .attr('transform', `translate(0,${svgConfig.height})`)
            .attr('class', 'x-axis')
            // Rotate text labels 90deg
            .selectAll('text')
            .attr('font-size', 12)
            .attr('y', 0)
            .attr('x', 9)
            .attr('dy', '.35em')
            .attr('transform', 'rotate(90)')
            .attr('text-anchor', 'start');

        /*  Legend */
        // config values
        let channelNames = uniqueChannelIDs.map((d) => {return channelConfig.get(d);});
        let legendConfig = {
            full_margin: 15,
            side_length: 10,
            margin: 5
        };

        let legend = svg.append('g')
            .attr('class', 'bar-legend-container')
            .attr('transform', `translate(${legendConfig.full_margin},${legendConfig.full_margin})`)
            .selectAll('g')
            .data(channelNames)
            .enter()
            .append('g')
            .style('margin', `${legendConfig.margin}px`)
            .attr('transform', (d, i) => {
                return `translate(${legendConfig.margin},${i*(legendConfig.margin*2 + legendConfig.side_length)})`
            });

        legend.append('rect')
            .attr('fill', (d, i) => {return colorScheme(i);})
            .attr('width', legendConfig.side_length)
            .attr('height', legendConfig.side_length);

        legend.append('text')
            .text((d) => {return d;})
            .attr('class', 'legend-text')
            .attr('transform', `translate(${legendConfig.side_length + 5},${legendConfig.side_length})`);
    }
}