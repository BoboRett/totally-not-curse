import React from 'react';

import AppProtocols from './modules/app-protocols';
import AppDirectories from './modules/app-directories';
import AppUpdater from './modules/app-updater';
import './app-settings.less';

const AppSettings = () => {
    return (
        <div className="app-settings">
            <AppProtocols />
            <AppDirectories />
            <AppUpdater />
        </div>
    );
};

export default AppSettings;
