import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';

const PageContainer = () => {
    const [config, setConfig] = useState(null);
    useEffect(() => {
        const getConfig = async () => {
            const res = await fetch('http://localhost:4000/config');
            const body = await res.json();
            setConfig(
                Object.entries(body).reduce((acc, [key, val]) => {
                    acc[key] = JSON.parse(val);
                    return acc;
                }, {})
            );
        };
        getConfig();
    }, []);

    return ( config === null
        ? <div> {"Loading data..."} </div>
        : <React.Fragment>
            <PageHeader
                config={config}
            >
            </PageHeader>
        </React.Fragment>
    );
};

export default PageContainer;
