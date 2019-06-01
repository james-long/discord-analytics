const Discord = require('discord.js');

class ProgressUpdate{
    constructor(channel){
        this.messageChannel = channel;
        this.currentlyFetchingChannel = '';
        this.fetchProgress = [];
        // Not sure how much overhead doing an existence check in an array will reasonably cause,
        // so we just leave the lookup to an object
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