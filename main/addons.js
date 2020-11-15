const cache = require('./cache');
const { ipcMain } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const taskQueue = require('promise-task-queue');
const _ = require('lodash');
const { ADDON_STATUS, UPDATE_LIMIT } = require('../utils/constants');
const AddonHelpers = require('./addon-types/helpers');
const { fromState } = require('./addon-types/curse');

function getAllAddonDirs(wowPath) {
    return new Promise((res, rej) => {
        const addonsDir = path.join(wowPath, 'Interface/addons');
        fs.readdir(addonsDir, (err, files) => {
            err && rej(err);
            res(files.filter(file => !file.startsWith('Blizzard_')));
        });
    });
}

function getCachedAddons(addonDirs) {
    const cachedAddons = cache.loadAddons();
    return _.transform(addonDirs, (acc, dir) => {
        acc[dir] = _.find(
            cachedAddons,
            addon => _.some(
                addon.folders,
                folder => folder.foldername === dir
            )
        );
    }, {});
}

function getInstalledAddons(ev, wowPath, refresh) {
    ev.sender.send('progress_start', undefined, 'Fetching cache');
    return getAllAddonDirs(wowPath)
        .then(getCachedAddons)
        .then(addonsByDir => fetchMissingAddons(addonsByDir, refresh, wowPath, ev.sender))
        .then(addons => _.uniqBy(addons, 'id'))
        .then(cache.saveAddons)
        .then(addons => {
            ev.sender.send('progress_end');
            return addons;
        })
    ;
}

function checkForUpdates(ev) {
    ev.sender.send('progress_start', undefined, 'Fetching cache');
    const cached = cache.loadAddons();
    ev.sender.send('progress_start', undefined, 'Fetching addons from Curse');
    const addons = AddonHelpers.parseCache(cached);
    return AddonHelpers.taskPerAddonGroup(addons, 'checkForUpdates').then(result => {
        ev.sender.send('progress_end');
        const allUpdates = _.assign({}, ..._.values(result));
        _.forEach(addons, addon => {
            addon.setStatus(allUpdates[addon.id] ? ADDON_STATUS.UPDATE_AVAIL : ADDON_STATUS.OK);
        });
        return addons;
    });
}

function fetchMissingAddons(addonsByDir, fetchAll, wowPath, sender) {
    const addons = _.invertBy(
        addonsByDir,
        addon => (fetchAll || _.isUndefined(addon)) ? 'missing' : 'found'
    );
    const allAddons = _.at(addonsByDir, addons.found || []);
    if(_.isUndefined(addons.missing)) {
        return _.values(addonsByDir);
    }
    sender.send('progress_start', addons.missing.length, 'Gathering directory data');
    return AddonHelpers.fromDirs(wowPath, addons.missing, sender)
        .then(foundAddons => _.concat(allAddons, foundAddons))
    ;
}

function getAddonDetails(ev, url) {
    try {
        const parsed = new URL(url);
        return AddonHelpers.constructorFromUrl(parsed).getDetailsFromUrl(parsed)
            .catch(() => null)
        ;
    } catch(err) {
        return null;
    }
}

function installAddon(ev, wowPath, type, ...args) {
    ev.sender.send('progress_start', undefined, 'Installing addon');
    return AddonHelpers.constructorFromType(type).install(ev.sender, wowPath, ...args)
        .then(addons => {
            setTimeout(cache.saveAddons, 500);
            ev.sender.send('progress_end');
            return addons;
        })
    ;
}

function uninstallAddon(ev, wowPath, addon) {
    ev.sender.send('progress_start', undefined, 'Removing addon');
    return AddonHelpers.fromState(addon).uninstall(wowPath)
        .then(() => {
            setTimeout(cache.saveAddons, 500);
            ev.sender.send('progress_end');
        })
    ;
}

function updateAddon({ addon, wowPath, target, sender }) {
    const addonId = _.toString(addon.id);
    const parsedAddon = fromState(addon);
    sender.send(addonId, { status: ADDON_STATUS.UPDATE_PROG });
    return parsedAddon.update(wowPath, target, sender);
}

function handle() {
    ipcMain.handle('getAddonDetails', getAddonDetails);

    ipcMain.handle('getInstalledAddons', getInstalledAddons);

    ipcMain.handle('installAddon', installAddon);
    ipcMain.handle('uninstallAddon', uninstallAddon);

    ipcMain.handle('checkForAddonUpdates', checkForUpdates);

    const queue = taskQueue();
    queue.define('addonUpdate', updateAddon, {
        concurrency: UPDATE_LIMIT
    });
    queue.on('queueCompleted:addonUpdate', cache.saveAddons);
    ipcMain.handle('updateAddon', (ev, addon, wowPath, target) => {
        ev.sender.send('' + addon.id, { status: ADDON_STATUS.UPDATE_WAIT });
        queue.push('addonUpdate', { addon, wowPath, target, sender: ev.sender });
    });
}

module.exports = { handle };
