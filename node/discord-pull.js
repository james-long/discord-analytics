//  Batch retrieve all messages from a given channel
getAllChannelMessages = async (channel, progressEmbed) => {
    const batchSize = 100; // Discord won't give us any more
    const updateInterval = 10;
    let earliestMessageID;
    let allMessages = new Map();
    progressEmbed.currentlyFetchingChannel = channel.name;
    await progressEmbed.updateProgress(channel.id, channel.name, allMessages.size);
    try {
        let moreMessagesExist = (await channel.fetchMessages({'limit': 1})).size;
        while (moreMessagesExist) { // While the channel has at least one result
            const data = await channel.fetchMessages({'limit': batchSize, 'before': earliestMessageID});
            earliestMessageID = data.last().id;
            allMessages = new Map([...allMessages, ...data]);
            if(allMessages.size % (batchSize * updateInterval) === 0){
                await progressEmbed.updateProgress(channel.id, channel.name, allMessages.size);
            }
            moreMessagesExist = (await channel.fetchMessages({'limit': 1, 'before': earliestMessageID})).size;
        }
    }
    catch(err){
        console.error(`Error occurred while extracting messages from #${channel.name}: ${err}`);
    }
    await progressEmbed.updateProgress(channel.id, channel.name, allMessages.size);
    return allMessages;
};

// Iterate through all channels and pull logs from each
exports.getAllMessageData = async (server, progressEmbed) => {
    let channelMap = server.channels;
    let allMessages = new Map();
    for(let channel of channelMap.values()){
        if(channel.type === 'text'){ // Filter out non-relevant channels
            channelMessages = await getAllChannelMessages(channel, progressEmbed);
            allMessages.set(channel.id, channelMessages);
        }
    }
    await progressEmbed.finishFetching();
    return allMessages;
};