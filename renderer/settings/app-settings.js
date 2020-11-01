import React from 'react';

import AppUpdater from './app-updater';
import './app-settings.less';

const AppSettings = () => {
    return (
        <div className="app-settings">
            <AppUpdater />
        </div>
    );
};

export default AppSettings;
