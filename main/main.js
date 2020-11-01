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
        // hot reload on directory changes
        require('electron-reload')(path.resolve(__dirname, './renderer'));
        win.webContents.openDevTools();
        win.loadURL('http://localhost:8080');
    } else {
        win.loadURL(`file://${path.join(__dirname, '../build/index.html')}`);
    }

    require('./addons.js').handle();
    require('./client.js').handle();
    require('./updates.js').handle();
    require('./window.js').handle();
}

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
