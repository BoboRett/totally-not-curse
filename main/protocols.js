const { ipcMain, app } = require("electron");
const isDev = require('electron-is-dev');
const path = require('path');
const _ = require('lodash');

function handle() {
    app.removeAsDefaultProtocolClient('twitch');

    ipcMain.handle('isProtocolHandled', (ev, scheme) => {
        const args = isDev ? [scheme, process.execPath, [path.resolve(process.argv[1])]] : [scheme];
        return app.isDefaultProtocolClient(...args);
    });
    ipcMain.handle('handleProtocol', (ev, scheme) => {
        const args = isDev ? [scheme, process.execPath, [path.resolve(process.argv[1])]] : [scheme];
        if(!app.setAsDefaultProtocolClient(...args)) {
            ev.sender.send('error', `Failed to register scheme: ${scheme}://`);
        } else {
            return Promise.resolve();
        }
    });

    app.on('second-instance', (ev, args) => {
        const url = _.last(args);
        console.log(url);
    });
}

module.exports = { handle };
