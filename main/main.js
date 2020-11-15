const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const protocols = require('./protocols.js');
const _ = require('lodash');
process.env.ELECTRON_DEV = isDev;

function createWindow () {
    const win = new BrowserWindow({
        minWidth: 512,
        width: 1280,
        minHeight: 512,
        height: 768,
        frame: false,
        webPreferences: {
            contextIsolation: true,
            preload: path.resolve(__dirname, './preload.js'),
            sandbox: true,
            worldSafeExecuteJavaScript: true
        }
    });

    const url = _.last(process.argv);
    const pageUrl = protocols.getPageUrl(url);
    if(isDev) {
        const installExtension = require('electron-devtools-installer').default;
        const REACT_DEVELOPER_TOOLS = require('electron-devtools-installer').REACT_DEVELOPER_TOOLS;
        installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log('An error occurred: ', err))
            .then(() => {
                win.webContents.openDevTools();
                win.loadURL(pageUrl);
            })
        ;
    } else {
        win.loadURL(pageUrl);
    }

    require('./addons.js').handle();
    require('./client.js').handle();
    protocols.handle(win);
    require('./updates.js').handle(win);
    require('./window.js').handle();
}

if(!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.whenReady().then(createWindow);

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
}
