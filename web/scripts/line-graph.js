// Initially called function to start the line graph creation
function d3create_linegraph(config, server_id){
    $.ajax({
        type: 'POST',
        url: 'http://localhost:3000/',
        data: JSON.stringify({
            queryAlias: 'messages_over_time_per_user'
        }),
        contentType: 'application/json'
    })
        .done((data) => {
            d3render_linegraph(JSON.parse(data), config, server_id);
        })
        .fail((xhr, status, err) => {
            $("p").text(err);
        });
}

// Reset everything when a new server is selected
function d3drop_linegraph(){
    d3.select('.line-graph').selectAll('*').remove();
    d3.select('.line-legend-container').selectAll('*').remove();
}

// obj is an array of data objects
function d3render_linegraph(dataSet, config, server_id){

    console.log(dataSet);

    // We are only concerned with the users and channels for now, we change it to a map on ID
    userConfig = JSON.parse(config.users)
        .reduce((acc, cur) => {
            return acc.set(cur.user_id, `${cur.name} #${cur.nickname_id}`);
        }, new Map());

    // Filter for a server
    dataSet = dataSet.filter((d) => {return d.server_id === server_id});

    // Various arrays containing unique entries (domains) of params of the dataset
    let uniqueDates = dataSet.reduce((acc, cur) => {
        if(!acc.includes(cur.date)){
            return acc.concat([cur.date]);
        }
        return acc;
    }, []);
    let uniqueUserIDs = dataSet.reduce((acc, cur) => {
        if(!acc.includes(cur.user_id)){
            return acc.concat([cur.user_id]);
        }
        return acc;
    }, []);

    // Split the data set into one array per date
    let dateSplit = uniqueDates.map((date) => {
        return dataSet.filter((d) => {return d.date === date});
    });
    dateSplit.forEach((arr, idx, orig) => {
        orig[idx] = arr.reduce((acc, cur) => {
            acc[cur.user_id] = +cur.message_count;
            return acc;// Create a key entry for the channel's message count
        }, { // User info consistent across all rows & a helpful auxillary function
            server_id: arr[0].server_id,
            server_name: arr[0].server_name,
            date: new Date(arr[0].date),
            getAllMessages: function(){
                return uniqueUserIDs.map((userID) => {
                    return this[userID];
                }).reduce((acc, cur) => {return acc + cur});
            },
            getMessages: function(userID){
                return(this[userID]);
            }
        });
    });

    // Apply a sort to the array based on date
    dateSplit.sort((x, y) => {
        return (+x.date) - (+y.date);
    });

    console.log(dateSplit);

    /*  ==============
        CONFIG
        ==============
     */

    // svg object
    let svg = d3.select('.line-graph');

    /*  Size variables */
    const svgConfig = {
        width: svg.attr('width'),
        height: svg.attr('height')
    };

    /*  Colour scheme */

    const colorScheme = d3.scaleOrdinal(d3.schemeCategory10);

    /*  Scales */
    // y scale
    // compute the maximum a single domain point can have for a given user (not summed)
    const partialDomain = uniqueUserIDs.map((userID) => {
        return dateSplit.reduce((acc, cur) => {
            return Math.max(acc, cur.getMessages(userID));
        }, 0);
    });
    const yScale = d3.scaleLinear()
        .domain([d3.max(partialDomain), 0]) // Reverse domain for axes to work
        .range([0, svgConfig.height]);
    // x scale
    const xScale = d3.scaleTime()
        .domain(d3.extent(dateSplit.map((d) => {return d.date;}))) // Ensure same sorting as the bars
        .range([0, svgConfig.width]);

    /*  Flags */
    // determines whether we have 'zoomed in' on a channel or not
    let zoomedIn = false;

    /*  ===================
        SVG Construction
        ===================
     */

    console.log(dateSplit);

    // one group per user
    let userGroups = svg.selectAll('path')
        .data(uniqueUserIDs)
        .enter()
        .append('path')
        .attr("fill", "none")
        .attr("stroke", (d, i) => {return colorScheme(i);})
        .attr("stroke-width", 1)
        .attr('data-user', (d) => {return d;})
        .attr('d', () => {
                return d3.line()
                    .x((d) => {
                        return xScale(d.date);
                    })
                    .y(() => {
                        // Initialize at 0-point on the y axis for initial transition
                        return yScale(0);
                    })
                    (dateSplit)
            }
        );

    // Helpful domain calculations for the below function
    // Array of all possible summed y-values
    const fullDomain = dateSplit.map((d) => {
        return d.getAllMessages();
    });
    // Array of all possible y-values for a given user
    const userDomain = function(userID){
        return dateSplit.map((d) => {
            return d.getMessages(userID);
        });
    };

    /* Axes */
    // y-axis
    let yAxis = svg
        .append('g')
        .call(d3.axisLeft().scale(yScale))
        .attr('class', 'y-axis');
    // x-axis
    let xAxis = svg
        .append('g')
        .call(d3.axisBottom()
            .scale(xScale)
            .ticks(d3.timeDay.every(1))
            // Display formatted date
            .tickFormat((d) => {return d.toLocaleDateString("en-US",
                {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });})
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

    // Transition helper: combineLines is a bool, userToZoom is an (optional) userID to zoom into
    function transitionLine(combineLines, userToZoom){
        // Determine y-scale based on highest value
        let finalYScale = yScale;   // Default to the mixed lines domain
        if(combineLines){   // Use domain of summed messages
            finalYScale.domain([d3.max(fullDomain), 0]);
        }
        else if(userToZoom !== undefined){
            finalYScale.domain([d3.max(userDomain(userToZoom)), 0]);
        }
        else{
            finalYScale.domain([d3.max(partialDomain), 0]); // Identical to original domain
        }

        userGroups.transition()
            .duration(1000)
            .ease(d3.easeExp)
            .attr('d', (userID) => {
                    return d3.line()
                        .x((d) => {
                            return xScale(d.date);
                        })
                        .y((d) => {
                            if(combineLines){   // Show all lines as 1
                                return finalYScale(d.getAllMessages());
                            }
                            else if(userToZoom !== undefined){  // Show a certain user's lines
                                if(userToZoom === userID){
                                    return finalYScale(d.getMessages(userID));
                                }
                                else{
                                    return finalYScale(0);
                                }
                            }
                            else{   // Show all lines
                                return finalYScale(d.getMessages(userID))
                            }
                        })
                        (dateSplit)
                }
            );

        yAxis.transition()
            .duration(1000)
            .ease(d3.easeExp)
            .call(d3.axisLeft().scale(finalYScale));
    }

    // Initial transition
    transitionLine(false);
    // Add transition function calls to the two buttons
    $('.line-graph-option-button:button')
        .click(function() {
            let id = $(this).attr('id');
            let wantToCombineLines;
            if(id === 'agg'){
                wantToCombineLines = true;
            }
            else if(id === 'user'){
                wantToCombineLines = false;
            }
            transitionLine(wantToCombineLines);
        });

    /*  Legend */
    // config values
    let legendConfig = {
        full_margin: 15,
        side_length: 10,
        margin: 5
    };

    // onclick function
    let legendOnClick = function(){
        // If we are not zoomed in, filter for this channel only - else reset the zoom
        let currUser = d3.select(this.parentNode).attr('data-user');
        transitionLine(false, currUser);
    };

    let legendContainer = d3.select('svg.line-legend-container')
        .attr('height', uniqueUserIDs.length * 25);

    let legend = legendContainer.append('g')
        .attr('class', 'legend-container')
        .attr('transform', `translate(${legendConfig.full_margin},${legendConfig.full_margin})`)
        .selectAll('g')
        .data(uniqueUserIDs)
        .enter()
        .append('g')
        .style('margin', `${legendConfig.margin}px`)
        .attr('transform', (d, i) => {
            return `translate(${legendConfig.margin},${i*(legendConfig.margin*2 + legendConfig.side_length)})`
        })
        .attr('data-user', (d) => {return d;});

    legend.append('rect')
        .attr('fill', (d, i) => {return colorScheme(i);})
        .attr('width', legendConfig.side_length)
        .attr('height', legendConfig.side_length)
        .on('click', legendOnClick);

    legend.append('text')
        .text((d) => {return userConfig.get(d);})
        .attr('class', 'legend-text')
        .attr('transform', `translate(${legendConfig.side_length + 5},${legendConfig.side_length})`)
        .on('click', legendOnClick);
}