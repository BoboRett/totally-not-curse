const { ipcMain, shell, dialog } = require('electron');

function handle(window) {
    ipcMain.handle('browseOpen', (sender, options) => dialog.showOpenDialog(window, options));
    ipcMain.handle('close', () => window.destroy());
    ipcMain.handle('minimise', () => window.minimize());
    ipcMain.handle('toggleFullscreen', () => window.isMaximized() ? window.unmaximize() : window.maximize());
    ipcMain.handle('open', (sender, url) => shell.openExternal(url));
}

module.exports = { handle };
