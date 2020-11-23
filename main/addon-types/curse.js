const { ADDON_TYPE, ADDON_STATUS } = require('../../utils/constants');
const Addon = require('./base');
const curse = require('../../utils/curse');
const path = require('path');
const { Pool, spawn, Worker } = require('threads');
const _ = require('lodash');

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
            state.gameVersion,
            state.summary,
            state.url,
            state.authors
        );
    }

    static async getDetailsFromUrl(url) {
        const addonId = url.searchParams.get('addonId');
        const fileId = url.searchParams.get('fileId');
        if(!addonId) { return null; }
        const addon = await curse.getAddonById(addonId);
        addon.file = fileId
            ? await curse.getAddonFileManifest(addonId, fileId)
            : await curse.getLatestFile(addonId)
        ;
        const requiredDependencies = _.filter(addon.file.dependencies, { type: 3 });
        addon.dependencies = requiredDependencies.length
            ? await curse.getAddonsById(_.map(requiredDependencies, 'addonId'))
            : []
        ;
        addon.type = ADDON_TYPE.CURSE;
        return addon;
    }

    static async install(sender, wowPath, addonId, fileId, skipDependencies) {
        const addonInfo = await curse.getAddonById(addonId);
        const { manifest, file } = await curse.getAddonFile(addonId, fileId);
        const addon = new CurseAddon(addonInfo.name, addonId);
        addon.authors = _.map(addonInfo.authors, 'name');
        addon.folders = manifest.modules;
        addon.version = manifest.displayName;
        addon.gameVersion = manifest.gameVersion[0];
        addon.releaseType = manifest.releaseType;
        addon.summary = addonInfo.summary;
        addon.url = addonInfo.websiteUrl;
        const dependencies = skipDependencies ? [] : await Promise.all(
            _(manifest.dependencies)
                .filter({ type: 3 })
                .map(dep => {
                    return curse.getLatestFile(dep.addonId)
                        .then(latestFile => CurseAddon.install(sender, wowPath, dep.addonId, latestFile.id))
                    ;
                })
        );
        return addon.replaceFiles(file, wowPath)
            .catch(err => {
                sender.send('error', `Failed to install ${addon.name}: ${err.message}`);
            })
            .then(() => _.flatten(_.concat(dependencies, addon)))
        ;
    }

    async update(wowPath, targetFile, sender) {
        const addonId = _.toString(this.id);
        sender.send(addonId, { status: ADDON_STATUS.UPDATE_PROG });
        targetFile = targetFile  || (await curse.getLatestFile(this.id, this.releaseType)).id;
        return CurseAddon.install(sender, wowPath, this.id, targetFile, true)
            .then(updated => {
                updated[0].status = ADDON_STATUS.UPDATE_COMPLETE;
                sender.send(addonId, updated[0]);
            })
            .catch(err => {
                sender.send('error', `Failed to update ${this.name}: ${err.message}`);
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
            match.file.displayName,
            match.file.gameVersion[0]
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
