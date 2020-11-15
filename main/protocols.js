const { ipcMain, app } = require("electron");
const isDev = require('electron-is-dev');
const path = require('path');
const _ = require('lodash');

function getPageUrl(url) {
    const pageUrl = isDev ? 'http://localhost:8080/' : `file://${path.join(__dirname, '../build/index.html')}`;
    let route = '';
    try {
        const parsed = new URL(url);
        if(parsed.protocol === 'curseforge:') {
            route = `#/addons/get?url=${encodeURIComponent(url)}`;
        }
    } catch(err) {
        route = '';
    }
    return pageUrl + route;
}

function handle(window) {
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
        window.loadURL(getPageUrl(url));
        window.focus();
    });
}

module.exports = { getPageUrl, handle };
