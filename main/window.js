const { ipcMain } = require('electron');
const BrowserWindow = require('electron').BrowserWindow;

function handle() {
    ipcMain.handle('window', (ev, action) => {
        const win = BrowserWindow.fromWebContents(ev.sender);
        switch(action) {
            case 'close':
                win.destroy();
                break;
            case 'minimise':
                win.minimize();
                break;
            case 'toggleFullscreen':
                win.isMaximized() ? win.unmaximize() : win.maximize();
                break;
            default:
                console.warn('No window action specified!');
        }
    });
}

module.exports = { handle };
