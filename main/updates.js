const { ipcMain } = require('electron');
const isDev = require('electron-is-dev');
const { autoUpdater, CancellationToken } = require('electron-updater');
const _ = require('lodash');

function handle() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    let cancellationToken = null;

    ipcMain.handle('checkForAppUpdate', (ev, allowPrerelease) => {
        autoUpdater.allowPrerelease = allowPrerelease;
        ev.sender.send('progress_start', undefined, 'Checking for update');
        return autoUpdater.checkForUpdates()
            .then(updateInfo => {
                ev.sender.send('progress_end');
                return updateInfo;
            })
        ;
    });
    ipcMain.handle('downloadAppUpdate', ev => {
        let progressStarted = false;
        const updateString = downloadEv => {
            const bToMB = val => _.round(val / 1e6, 2);
            return `Downloading update - `
                + `${bToMB(downloadEv.transferred)}/${bToMB(downloadEv.total)}MB`
                + `(${bToMB(downloadEv.bytesPerSecond)} MB/s)`
            ;
        };
        autoUpdater.on('download-progress', downloadEv => {
            if(!progressStarted) {
                progressStarted = true;
                ev.sender.send('progress_start', downloadEv.total, updateString(downloadEv));
            }
            ev.sender.send('progress', downloadEv.delta, updateString(downloadEv));
        });
        cancellationToken = new CancellationToken();
        ev.sender.send('progress_start', undefined, 'Preparing update');
        return autoUpdater.downloadUpdate(cancellationToken)
            .then(() => {
                ev.sender.send('progress_end');
                return false;
            })
            .catch(() => {
                ev.sender.send('progress_end', undefined, 'Update cancelled');
                return true;
            })
        ;
    });
    ipcMain.handle('cancelAppUpdate', () => {
        cancellationToken.cancel();
    });
    ipcMain.handle('getAppVersion', () => {
        return autoUpdater.currentVersion;
    });
    ipcMain.handle('installAppUpdate', () => {
        if(isDev) {
            throw new Error('Don\'t try to install an update in dev :)');
        } else {
            autoUpdater.quitAndInstall(false, true);
        }
    });
}

module.exports = { handle };
