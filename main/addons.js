const curse = require('../utils/curse');
const cache = require('./cache');
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { spawn, Pool, Worker } = require('threads');
const { ADDON_STATUS, ADDON_TYPE, ADDON_RELEASE_TYPE } = require('../utils/constants');

function getAllAddonDirs(wowPath) {
    return new Promise((res, rej) => {
        const addonsDir = path.join(wowPath, 'Interface/addons');
        fs.readdir(addonsDir, (err, files) => {
            err && rej(err);
            res(files.filter(file => !file.startsWith('Blizzard_')));
        });
    });
}

function buildAddon(name, id, type, folders, releaseType) {
    return {
        name,
        type,
        id,
        folders: _.map(folders, folder => ({ foldername: folder.foldername, fingerprint: folder.fingerprint })),
        status: ADDON_STATUS.OK,
        releaseType: releaseType || ADDON_RELEASE_TYPE.STABLE
    };
}

function hydrateCurseAddon(base, addon) {
    return _.assign(base, {
        type: ADDON_TYPE.CURSE,
        name: addon.name,
        summary: addon.summary,
        url: addon.websiteUrl,
        authors: _.map(addon.authors, author => _.pick(author, ['id', 'name', 'url'])),
        categories: _.map(addon.categories, 'categoryId')
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

function getCustomId(addonMap) {
    const min = _.minBy(addonMap, 'id');
    return _.get(min,'id') < 1 ? min.id - 1 : -1;
}

function getAddonDirFingerprints(wowPath, queryAddons, sender) {
    const pool = Pool(() => spawn(new Worker('../utils/fingerprint.worker.js')));
    const workerChunks = _.chunk(queryAddons, 20);
    return Promise.all(_.map(workerChunks, workerData => pool.queue(async fingerprinter => {
        workerData = _.map(workerData, dir => path.resolve(wowPath, 'Interface/Addons', dir));
        const fingerprints = await fingerprinter(workerData);
        sender.send('progress', workerData.length, 'Gathering directory data');
        return fingerprints;
    })))
        .then(async allFingerprints => {
            await pool.terminate();
            return _.flatten(allFingerprints);
        });
}

function fetchMissingAddons(addonsByDir, fetchAll, wowPath, sender) {
    const addons = _.invertBy(
        addonsByDir,
        addon => (fetchAll || _.isUndefined(addon)) ? 'missing' : 'found'
    );
    const allAddons = _.at(addonsByDir, addons.found || []);
    if(_.isUndefined(addons.missing)) {
        return allAddons;
    }
    sender.send('progress_start', addons.missing.length, 'Gathering directory data');
    return getAddonDirFingerprints(wowPath, addons.missing, sender)
        .then(fingerprints => {
            sender.send('progress_start', undefined, 'Fetching addons from Curse');
            return curse.getFilesByFingerprint(fingerprints);
        })
        .then(files => {
            const hits = _.concat(files.exactMatches, files.partialMatches);
            return _.transform(hits, (matches, match) => {
                _.forEach(match.file.modules, module => {
                    matches[module.foldername] = match;
                });
            }, {});
        })
        .then(matchByDir => {
            return _.transform(addons.missing, (curseAddons, missingAddon) => {
                const match = matchByDir[missingAddon];
                if(match) {
                    const addon = curseAddons[match.id]
                        || buildAddon(
                            missingAddon,
                            match.id,
                            ADDON_TYPE.REMOVED,
                            match.file.modules,
                            match.file.releaseType
                        )
                    ;
                    curseAddons[match.id] = addon;
                    allAddons.push(addon);
                } else {
                    const addon = buildAddon(
                        missingAddon,
                        getCustomId(allAddons),
                        ADDON_TYPE.CUSTOM,
                        [{ foldername: missingAddon, fingerprint: 0 }]
                    );
                    allAddons.push(addon);
                }
            }, {});
        })
        .then(curseAddons => {
            const addonIds = _.keys(curseAddons);
            return addonIds.length && curse.getAddonsById(addonIds)
                .then(addons => {
                    return _.map(addons, fetchedAddon => {
                        const addon = curseAddons[fetchedAddon.id];
                        hydrateCurseAddon(addon, fetchedAddon);
                    });
                })
            ;
        })
        .then(() => allAddons)
    ;
}

function handle() {
    ipcMain.handle('getAddonById', (ev, curseId) => {
        return curse.getAddonById(curseId);
    });

    ipcMain.handle('getInstalledAddons', (ev, wowPath, refresh) => {
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
    });

    ipcMain.handle('checkForUpdates', ev => {
        ev.sender.send('progress_start', undefined, 'Fetching cache');
        const cached = cache.loadAddons();
        const ids = _.map(cached, 'id');
        ev.sender.send('progress_start', undefined, 'Fetching addons from Curse');
        return curse.getAddonsById(ids)
            .then(addons => {
                _.forEach(addons, addon => {
                    const cachedAddon = _.find(cached, { id: addon.id });
                    cachedAddon.status = _.some(
                        addon.latestFiles,
                        file => file.releaseType === cachedAddon.releaseType
                            && file.gameVersionFlavor === 'wow_retail'
                            && _.every(file.modules, module => _.find(cachedAddon.folders, { fingerprint: module.fingerprint }))
                    )
                        ? ADDON_STATUS.OK
                        : ADDON_STATUS.UPDATE_AVAIL
                    ;
                });
                ev.sender.send('progress_end');
                return cached;
            })
        ;
    });
}

module.exports = { handle };
