import React, { useCallback, useEffect, useMemo, useState } from 'react';

import './app-updater.less';

const AppUpdater = () => {
    const [appVersion, setAppVersion] = useState(null);
    const [isCheckingForUpdate, setCheckingForUpdate] = useState(false);
    const [isDownloadingUpdate, setDownloadingUpdate] = useState(false);
    const [isUpdateAvailable, setUpdateAvailable] = useState(false);
    const [isUpdateReady, setUpdateReady] = useState(false);
    const [allowPrerelease, setAllowPrerelease] = useState(false);
    const [update, setUpdate] = useState(null);

    const checkForUpdates = useCallback(() => {
        setCheckingForUpdate(true);
        api.app.updates.checkForAppUpdate(allowPrerelease)
            .then(updateInfo => {
                setCheckingForUpdate(false);
                if(_.has(updateInfo, 'downloadPromise')) {
                    setUpdateAvailable(true);
                    setUpdate(_.get(updateInfo, 'updateInfo'));
                }
            })
        ;
    }, [allowPrerelease]);
    const downloadUpdate = useCallback(() => {
        setDownloadingUpdate(true);
        api.app.updates.downloadAppUpdate()
            .then(cancelled => {
                setDownloadingUpdate(false);
                setUpdateReady(!cancelled);
            });
    }, []);
    const onSetAllowPrerelease = useCallback(ev => {
        setAllowPrerelease(ev.currentTarget.checked);
        setUpdateAvailable(false);
        setUpdate(null);
    });

    useEffect(() => {
        api.app.updates.getAppVersion().then(version => {
            setAppVersion(version);
            setAllowPrerelease(_.get(version, 'prerelease', []).length > 0);
        });
    }, []);

    const buttonText = useMemo(() => (
        (isUpdateReady && 'Install update') ||
        (isDownloadingUpdate && 'Cancel download') ||
        (isUpdateAvailable && 'Download update') ||
        'Check for update'
    ), [isDownloadingUpdate, isUpdateAvailable, isUpdateReady]);

    const buttonHandler = useMemo(() => (
        (isUpdateReady && api.app.updates.installAppUpdate) ||
        (isDownloadingUpdate && api.app.updates.cancelAppUpdate) ||
        (isUpdateAvailable && downloadUpdate) ||
        checkForUpdates
    ), [isDownloadingUpdate, isUpdateAvailable, isUpdateReady, checkForUpdates, downloadUpdate]);

    return (
        <div className="app-updater">
            <p className="app-settings__entry">
                <span className="app-settings__entry-heading">Current</span>
                <span className="app-settings__entry-value_text">{ _.get(appVersion, 'version', 'Fetching version...') }</span>
            </p>
            <p className="app-settings__entry">
                <span className="app-settings__entry-heading">Latest</span>
                <span className="app-settings__entry-value_text">{ _.get(update, 'version', '') }</span>
            </p>
            <label className="app-settings__entry">
                <span className="app-settings__entry-heading">Allow pre-release?</span>
                <input
                    className="app-settings__entry-value_checkbox"
                    type="checkbox"
                    checked={allowPrerelease} onChange={onSetAllowPrerelease}
                />
            </label>
            <button
                className="app-updater__update"
                disabled={isCheckingForUpdate}
                onClick={buttonHandler}
            >
                { buttonText }
            </button>
        </div>
    );
};

export default AppUpdater;
