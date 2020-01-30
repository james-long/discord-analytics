const Discord = require('discord.js');
const baseEmbed = new Discord.RichEmbed()
    .setTitle('Fetching all historical messages...')
    .setDescription('')
    .setColor(0xDAF7A6);

/**
 * Discord chat interface to output updates to a given channel on message fetching status
 */

class DataPullProgressUpdater{
    constructor(channel){
        this.messageChannel = channel;
        this.fetchProgress = [];
        this.currentlyFetchingChannel = '';

        this.progressUpdateMsg = null;
        this.progressUpdateEmbed = baseEmbed;
    }

    setCurrentlyFetchingChannel(c){
        this.currentlyFetchingChannel = c;
    }

    async sendInitialMessage(){
        this.progressUpdateMsg = await this.messageChannel.send(this.progressUpdateEmbed);
    }

    finishFetching(){
        const newDesc = `Fetching complete!\n${this.fetchProgressToText()}`;
        this.progressUpdateEmbed = this.progressUpdateEmbed.setDescription(newDesc);
        return this.progressUpdateMsg.edit(this.progressUpdateEmbed);
    }

    updateProgress(channelID, channelName, numFetched){
        const channelIdx = this.fetchProgress.findIndex((elem) =>
            elem.channelID === channelID && elem.channelName === channelName
        );

        if(channelIdx === -1){
            this.fetchProgress.push({
                channelID,
                channelName,
                numFetched,
            });
        }
        else{
            this.fetchProgress[channelIdx].numFetched = numFetched;
        }

        const newDesc = (
            this.currentlyFetchingChannel
                ? `Fetching for #${this.currentlyFetchingChannel}...\n`
                : ''
            ) + this.fetchProgressToText();
        this.progressUpdateEmbed = this.progressUpdateEmbed.setDescription(newDesc);
        return this.progressUpdateMsg.edit(this.progressUpdateEmbed);
    }

    fetchProgressToText(){
        const generateFetchMessage = (data) => {
            console.log(data);
            const { channelName, numFetched } = data;
            return `#${channelName}: Fetched total of ${numFetched}`;
        };

        return this.fetchProgress
            .map((data) => generateFetchMessage(data))
            .join('\n');
    }
}

module.exports = {
    DataPullProgressUpdater,
};