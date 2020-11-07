const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
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

    
    if(isDev) {
        const installExtension = require('electron-devtools-installer').default;
        const REACT_DEVELOPER_TOOLS = require('electron-devtools-installer').REACT_DEVELOPER_TOOLS;
        installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log('An error occurred: ', err))
            .then(() => {
                win.webContents.openDevTools();
                win.loadURL('http://localhost:8080');
            })
        ;
    } else {
        win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
    }

    require('./addons.js').handle();
    require('./client.js').handle();
    require('./protocols.js').handle();
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
