import React, { useState, useEffect } from 'react';
import LabelledDropdown from './LabelledDropdown';
import './css/PageHeader.css';

const PageHeader = ( props ) => {
    const { config } = props;
    const {
        channels,
        users,
        roles,
        servers,
    } = config;

    console.log(config);
    const [serverID, setServerID] = useState(servers[0].server_id);

    const filteredChannels = channels.filter((e) => e.server_id === serverID && e.type === "text");
    const filteredUsers = users.filter((e) => e.server_id === serverID);
    const filteredRoles = roles.filter((e) => e.server_id === serverID);

    const [channelID, setChannelID] = useState(filteredChannels[0].channel_id);
    const [userID, setUserID] = useState(filteredUsers[0].user_id);
    const [roleID, setRoleID] = useState(filteredRoles[0].role_id);

    return (
        <div id={"header-container"}>
            { serverID === null
                ? <div id={"server-image"}/>
                : <img
                    id={"server-image"}
                    src={(servers.find((e) => e.server_id === serverID) || {}).icon_url}
                />
            }
            <div id={"filters"}>
                <LabelledDropdown
                    label={"Servers"}
                    options={servers.map((e) => e.server_id)}
                    optionsDisplay={servers.map((e) => e.name)}
                    setSelected={setServerID}
                />
                {/* TODO make these multi-select*/}
                <LabelledDropdown
                    label={"Channels"}
                    options={filteredChannels.map((e) => e.channel_id)}
                    optionsDisplay={filteredChannels.map((e) => e.name)}
                    setSelected={setChannelID}
                />
                <LabelledDropdown
                    label={"Users"}
                    options={filteredUsers.map((e) => e.user_id)}
                    optionsDisplay={filteredUsers.map((e) => `${e.name}#${e.nickname_id}`)}
                    setSelected={setUserID}
                />
                <LabelledDropdown
                    label={"Roles"}
                    options={filteredRoles.map((e) => e.role_id)}
                    optionsDisplay={filteredRoles.map((e) => e.name)}
                    setSelected={setRoleID}
                />
            </div>
        </div>
    );
};

export default PageHeader;