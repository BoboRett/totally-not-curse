const { ADDON_TYPE, ADDON_STATUS } = require('../../utils/constants');
const Addon = require('./base');
const curse = require('../../utils/curse');
const path = require('path');
const { Pool, spawn, Worker } = require('threads');
const _ = require('lodash');
const axios = require('axios');

class CurseAddon extends Addon {
    constructor() {
        super(ADDON_TYPE.CURSE, ...arguments);
    }

    static async checkForUpdates(addons) {
        const addonsById = _.keyBy(addons, 'id');
        return curse.getAddonsById(_.keys(addonsById))
            .then(curseAddons => {
                const curseAddonById = _.keyBy(curseAddons, 'id');
                return _.mapValues(addonsById, addon => {
                    const curseAddon = curseAddonById[addon.id];
                    if(_.isNil(curseAddon)) {
                        addon.type = ADDON_TYPE.REMOVED;
                        return false;
                    } else {
                        return !_.some(
                            curseAddon.latestFiles,
                            file => file.releaseType === addon.releaseType
                                && file.gameVersionFlavor === 'wow_retail'
                                && _.every(file.modules, module => _.find(addon.folders, { fingerprint: module.fingerprint }))
                        );
                    }
                });
            })
        ;
    }

    static async fromDirs(wowPath, dirs, progressReporter) {
        progressReporter.send('progress_start', dirs.length, 'Gathering directory data');
        const fingerprints = await getFingerprints(wowPath, dirs, progressReporter);
        progressReporter.send('progress_start', undefined, 'Fetching addons from Curse');
        const files = await curse.getFilesByFingerprint(fingerprints, 3);
        const matchByDir = _.transform(files, (matches, match) => {
            _.forEach(match.file.modules, module => {
                matches[module.foldername] = match;
            });
        }, {});
        const addonsByDir = await hydrateMatches(matchByDir);
        return _.transform(dirs, (matches, dir) => {
            const foundAddon = addonsByDir[dir];
            if(foundAddon) {
                matches.matched.push(foundAddon);
            } else {
                matches.unmatched.push(dir);
            }
        }, { matched: [], unmatched: [] });
    }

    static fromState(state) {
        return new CurseAddon(
            state.name,
            state.id,
            state.folders,
            state.releaseType,
            state.version,
            state.summary,
            state.url
        );
    }

    update(wowPath, targetFingerprint, progressReporter) {
        const addonId = _.toString(this.id);
        progressReporter.send(addonId, { status: ADDON_STATUS.UPDATE_PROG });
        const fileGetter = (
            targetFingerprint 
                ? curse.getAddonFileManifest(this.id, targetFingerprint)
                : curse.getAddonById(this.id)
                    .then(curseAddon => {
                        return _.find(curseAddon.latestFiles, file => (
                            file.releaseType === this.releaseType
                                && file.gameVersionFlavor === 'wow_retail'
                        ));
                    })
        );
        return fileGetter
            .then(latestFile => {
                if(!latestFile) {
                    throw new Error('uh ohs, no file found');
                } else {
                    return axios.get(latestFile.downloadUrl, {
                        responseType: 'stream'
                    })
                        .then(response => {
                            this.folders = latestFile.modules;
                            this.version = latestFile.displayName;
                            this.releaseType = latestFile.releaseType;
                            return response.data;
                        })
                    ;
                }
            })
            .then(zipStream => this.replaceFiles(zipStream, wowPath, progressReporter))
            .then(() => {
                this.setStatus(ADDON_STATUS.UPDATE_COMPLETE);
                this.updateProgress = 1;
                progressReporter.send(addonId, this);
            })
            .catch(err => {
                progressReporter.send('error', `Failed to update ${this.name}: ${err.message}`);
            })
        ;
    }
}

function getFingerprints(wowPath, queryAddons, sender) {
    const pool = Pool(() => spawn(new Worker('../../utils/fingerprint.worker.js')));
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

async function hydrateMatches(matchByDir) {
    const addonIds = _.map(matchByDir, 'id');
    if(addonIds.length === 0) {
        return {};
    }
    const foundAddons = _.keyBy(await curse.getAddonsById(addonIds), 'id');
    const builtAddons = {};
    return _.mapValues(matchByDir, match => {
        const builtAddon = builtAddons[match.id];
        if(builtAddon) {
            return builtAddon;
        }
        const addon = new CurseAddon(
            match.file.modules[0].foldername,
            match.id,
            match.file.modules,
            match.file.releaseType,
            match.file.displayName
        );
        const foundAddon = foundAddons[match.id];
        if(foundAddon) {
            addon.name = foundAddon.name;
            addon.summary = foundAddon.summary;
            addon.url = foundAddon.websiteUrl;
            addon.authors = _.map(foundAddon.authors, 'name');
        } else {
            // file exists but addon is no longer available
            addon.type = ADDON_TYPE.REMOVED;
        }
        return addon;
    });
}

module.exports = CurseAddon;
