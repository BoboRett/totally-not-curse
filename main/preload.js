const { contextBridge, ipcRenderer: renderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // window
    closeWindow: () => renderer.send('window', 'close'),
    minimiseWindow: () => renderer.send('window', 'minimise'),
    fullscreenWindow: () => renderer.send('window', 'toggleFullscreen'),
    // client
    findWow: () => renderer.invoke('findWow'),
});
