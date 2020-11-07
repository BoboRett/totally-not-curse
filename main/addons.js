const axios = require('axios');
const curse = require('../utils/curse');
const cache = require('./cache');
const { ipcMain } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const taskQueue = require('promise-task-queue');
const unzipper = require('unzipper');
const _ = require('lodash');
const { spawn, Pool, Worker } = require('threads');
const { ADDON_STATUS, ADDON_TYPE, ADDON_RELEASE_TYPE, UPDATE_LIMIT } = require('../utils/constants');

function getAllAddonDirs(wowPath) {
    return new Promise((res, rej) => {
        const addonsDir = path.join(wowPath, 'Interface/addons');
        fs.readdir(addonsDir, (err, files) => {
            err && rej(err);
            res(files.filter(file => !file.startsWith('Blizzard_')));
        });
    });
}

function buildAddon(name, id, type, folders, releaseType, version) {
    return {
        name,
        type,
        id,
        version,
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
            return curse.getFilesByFingerprint(fingerprints, 3);
        })
        .then(files => {
            return _.transform(files, (matches, match) => {
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
                            match.file.releaseType,
                            match.file.displayName
                        )
                    ;
                    curseAddons[match.id] = addon;
                    allAddons.push(addon);
                } else {
                    const addon = buildAddon(
                        missingAddon,
                        getCustomId(allAddons),
                        ADDON_TYPE.CUSTOM,
                        [{ foldername: missingAddon, fingerprint: 0 }],
                        ADDON_RELEASE_TYPE.STABLE,
                        '[custom]'
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

function updateAddon({ addon, wowPath, target, sender }) {
    const addonId = _.toString(addon.id);
    sender.send(addonId, { status: ADDON_STATUS.UPDATE_PROG });
    return (
        target 
            ? curse.getAddonFileManifest(addon.id, target)
            : curse.getAddonById(addonId)
                .then(curseAddon => {
                    return _.find(curseAddon.latestFiles, file => (
                        file.releaseType === addon.releaseType
                            && file.gameVersionFlavor === 'wow_retail'
                    ));
                })
    )
        .then(latestFile => {
            if(!latestFile) {
                throw new Error('uh ohs, no file found');
            } else {
                return axios.get(latestFile.downloadUrl, {
                    responseType: 'stream',
                    onDownloadProgress(ev) { console.log('progress', ev); }
                })
                    .then(response => {
                        addon.folders = latestFile.modules;
                        addon.version = latestFile.displayName;
                        return response.data;
                    })
                ;
            }
        })
        .then(fileStream => {
            const addonPath = path.join(wowPath, 'Interface/addons');
            _.forEach(addon.folders, folder => {
                fs.removeSync(path.join(addonPath, folder.foldername));
            });
            return fileStream
                .pipe(unzipper.Extract({ path: addonPath }))
                .promise()
            ;
        })
        .then(() => {
            sender.send(addonId, _.assign(addon, { status: ADDON_STATUS.UPDATE_COMPLETE }));
        })
        .catch(err => {
            console.log(err);
        })
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

    ipcMain.handle('checkForAddonUpdates', ev => {
        ev.sender.send('progress_start', undefined, 'Fetching cache');
        const cached = cache.loadAddons();
        const ids = _.map(cached, 'id');
        ev.sender.send('progress_start', undefined, 'Fetching addons from Curse');
        return curse.getAddonsById(ids)
            .then(addons => {
                const curseAddons = _.keyBy(addons, 'id');
                _.forEach(cached, addon => {
                    const curseAddon = curseAddons[addon.id];
                    if(_.isNil(curseAddon)) {
                        addon.status = ADDON_STATUS.OK;
                    } else {
                        addon.status = _.some(
                            curseAddon.latestFiles,
                            file => file.releaseType === addon.releaseType
                                && file.gameVersionFlavor === 'wow_retail'
                                && _.every(file.modules, module => _.find(addon.folders, { fingerprint: module.fingerprint }))
                        )
                            ? ADDON_STATUS.OK
                            : ADDON_STATUS.UPDATE_AVAIL
                        ;
                    }
                });
                ev.sender.send('progress_end');
                return cached;
            })
        ;
    });

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
