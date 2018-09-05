//  Batch retrieve all messages from a given channel
getAllChannelMessages = async (channel) => {
    let batchSize = 100;
    let earliestMessageID;
    let allMessages = new Map();
    try {
        let moreMessagesExist = (await channel.fetchMessages({'limit': 1})).size;
        while (moreMessagesExist) { // While the channel has at least one result
            let data;
            data = await channel.fetchMessages({'limit': batchSize, 'before': earliestMessageID});
            earliestMessageID = data.last().id;
            allMessages = new Map([...allMessages, ...data]);
            console.log(`[${new Date().toUTCString()}] Got ${data.size} messages back from #${channel.name}, total ${allMessages.size}.`);
            moreMessagesExist = (await channel.fetchMessages({'limit': 1, 'before': earliestMessageID})).size;
        }
    }
    catch(err){
        console.error(`Error occurred while extracting messages from #${channel.name}: ${err}`);
    }
    return allMessages;
};

// Iterate through all channels and pull logs from each
exports.getAllMessageData = async (server) => {
    let channelMap = server.channels;
    let allMessages = new Map();
    for(let channel of channelMap.values()){
        if(channel.type === 'text'){ // Filter out non-relevant channels
            channelMessages = await getAllChannelMessages(channel);
            allMessages.set(channel.id, channelMessages);
        }
    }
    return allMessages;
};