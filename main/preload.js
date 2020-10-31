const { contextBridge, ipcRenderer: renderer } = require('electron');
const EventEmitter = require('events');

contextBridge.exposeInMainWorld('api', {
    // window
    closeWindow: () => renderer.send('window', 'close'),
    minimiseWindow: () => renderer.send('window', 'minimise'),
    fullscreenWindow: () => renderer.send('window', 'toggleFullscreen'),
    // client
    findWow: () => renderer.invoke('findWow'),
    // addons
    checkForUpdates: () => renderer.invoke('checkForUpdates'),
    getInstalledAddons: (wowPath, refresh) => renderer.invoke('getInstalledAddons', wowPath, refresh),
    getAddon: curseId => renderer.invoke('getAddonById', curseId),
    updateAddon: (addon, wowPath) => {
        const events = new EventEmitter();
        renderer.on(addon.id, (ev, ...payload) => events.emit('update', ...payload));
        renderer.invoke('updateAddon', addon, wowPath);
        return wrapEmitter(events);
    }
});
function wrapEmitter(emitter) {
    return {
        emit() { return emitter.emit(...arguments); },
        on() { return emitter.on(...arguments); },
        off(){ return emitter.off(...arguments); },
        removeAllListeners(){ return emitter.removeAllListeners(...arguments); }
    };
}

const globalEvents = new EventEmitter();
contextBridge.exposeInMainWorld('events', wrapEmitter(globalEvents));

renderer.on('progress', (ev, ...payload) => globalEvents.emit('progress', ...payload));
renderer.on('progress_start', (ev, ...payload) => globalEvents.emit('progress_start', ...payload));
renderer.on('progress_end', (ev, ...payload) => globalEvents.emit('progress_end', ...payload));
renderer.on(EventEmitter.errorMonitor, (ev, ...payload) => globalEvents.emit('error', ...payload));
