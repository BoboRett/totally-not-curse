const { contextBridge, ipcRenderer: renderer } = require('electron');
const EventEmitter = require('events');

contextBridge.exposeInMainWorld('api', {
    // window
    window: {
        closeWindow: () => renderer.invoke('close'),
        minimiseWindow: () => renderer.invoke('minimise'),
        fullscreenWindow: () => renderer.invoke('toggleFullscreen'),
        open: url => renderer.invoke('open', url)
    },
    app: {
        // app - protocols
        protocols: {
            handleProtocol: scheme => renderer.invoke('handleProtocol', scheme),
            isProtocolHandled: scheme => renderer.invoke('isProtocolHandled', scheme)
        },
        // app - updates
        updates: {
            cancelAppUpdate: () => renderer.invoke('cancelAppUpdate'),
            checkForAppUpdate: allowPrerelease => renderer.invoke('checkForAppUpdate', allowPrerelease),
            downloadAppUpdate: () => renderer.invoke('downloadAppUpdate'),
            getAppVersion: () => renderer.invoke('getAppVersion'),
            installAppUpdate: () => renderer.invoke('installAppUpdate'),
        },
    },
    // client
    findWow: () => renderer.invoke('findWow'),
    // addons
    addons: {
        checkForAddonUpdates: () => renderer.invoke('checkForAddonUpdates'),
        getAddonDetails: url => renderer.invoke('getAddonDetails', url),
        getInstalledAddons: (wowPath, refresh) => renderer.invoke('getInstalledAddons', wowPath, refresh),
        installAddon: (wowPath, type, ...args) => renderer.invoke('installAddon', wowPath, type, ...args),
        uninstallAddon: (wowPath, addon) => renderer.invoke('uninstallAddon', wowPath, addon),
        updateAddon: (addon, wowPath, target) => {
            const events = new EventEmitter();
            renderer.on(addon.id, (ev, ...payload) => events.emit('update', ...payload));
            renderer.invoke('updateAddon', addon, wowPath, target);
            return wrapEmitter(events);
        }
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
renderer.on('error', (ev, ...payload) => globalEvents.emit('error', ...payload));
