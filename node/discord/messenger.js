const Discord = require('discord.js');

/**
 * Discord chat interface to output updates to a given channel on message fetching status
 */

class ProgressUpdate{
    constructor(channel){
        this.messageChannel = channel;
        this.currentlyFetchingChannel = '';
        // fetchProgress holds objects {channelID, channelName, numFetched},
        // fetchProgressKeys maps channelIDs to their index in fetchProgress
        this.fetchProgress = [];
        this.fetchProgressKeys = {};
    }
    async sendInitialMessage(){
        const embed = new Discord.RichEmbed()
            .setTitle('Fetching all historical messages...')
            .setDescription('')
            .setColor(0xDAF7A6);
        const message = await this.messageChannel.send(embed);
        this.progressUpdateEmbed = embed;
        this.progressUpdateMsg = message;
    }
    finishFetching(){
        const newDesc = 'Fetching complete!\n'
            + this.fetchProgressToText();
        this.progressUpdateEmbed = this.progressUpdateEmbed.setDescription(newDesc);
        return this.progressUpdateMsg.edit(this.progressUpdateEmbed);
    }
    updateProgress(channelID, channelName, numFetched){
        if(typeof this.fetchProgressKeys[channelID] === 'undefined'){
            this.fetchProgressKeys[channelID] = this.fetchProgress.length;
        }
        const keyIdx = this.fetchProgressKeys[channelID];
        this.fetchProgress[keyIdx] = {
            channelID,
            channelName,
            numFetched,
        };

        const newDesc = (this.currentlyFetchingChannel ? `Fetching for #${this.currentlyFetchingChannel}...\n` : '')
            + this.fetchProgressToText();
        this.progressUpdateEmbed = this.progressUpdateEmbed.setDescription(newDesc);
        return this.progressUpdateMsg.edit(this.progressUpdateEmbed);
    }
    fetchProgressToText(){
        const generateFetchMessage = (channelID, channelName, numFetched) =>
            `#${channelName}: Fetched total of ${numFetched}`;
        return this.fetchProgress
            .map((e) => generateFetchMessage(e.channelID, e.channelName, e.numFetched))
            .join('\n');
    }
}

module.exports = {
    ProgressUpdate,
};