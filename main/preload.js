const { contextBridge, ipcRenderer: renderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    closeWindow: () => renderer.send('window', 'close'),
    minimiseWindow: () => renderer.send('window', 'minimise'),
    fullscreenWindow: () => renderer.send('window', 'toggleFullscreen')
});
