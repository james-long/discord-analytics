const HELPER_SELECTORS = {
    serverDropdownSelected: '#server-dropdown option:selected',
    channelDropdownSelected: '#channel-dropdown option:selected',
    userDropdownSelected: '#user-dropdown option:selected',
};

// TODO add <none> option to channel and user
function getSelectedServerID(){
    return $(HELPER_SELECTORS.serverDropdownSelected).attr('data-server-id');
}

function getSelectedChannelID(){
    return $(HELPER_SELECTORS.channelDropdownSelected).attr('data-channel-id');
}

function getSelectedUserID(){
    return $(HELPER_SELECTORS.userDropdownSelected).attr('data-user-id');
}

// Given a name, nickname, and nickname ID, formats to `Nick (User#NickID)` or `User#NickID`
function formatUsername(name, nick, nickID){
    return (nick === null ? `${name}#${nickID}` : `${nick} (${name}#${nickID})`);
}