const { ADDON_RELEASE_TYPE } = require('../../utils/constants');
const path = require('path');
const unzipper = require('unzipper');
const _ = require('lodash');
const { shell } = require('electron');

class Addon {
    constructor(type, name, id, folders, releaseType, version, gameVersion, summary, url, authors) {
        if (new.target === Addon) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
        this.type = type;
        this.name = name;
        this.id = id;
        this.folders = folders || [];
        this.authors = authors || [];
        this.summary = summary || '';
        this.url = url || '';
        this.releaseType = releaseType || ADDON_RELEASE_TYPE.STABLE;
        this.version = version || '1.0.0';
        this.gameVersion = gameVersion;
    }

    removeFiles(basePath) {
        const addonPath = path.join(basePath, 'Interface/addons');
        _.forEach(this.folders, folder => {
            shell.moveItemToTrash(path.join(addonPath, folder.foldername));
        });
    }

    replaceFiles(zipStream, basePath) {
        const addonPath = path.join(basePath, 'Interface/addons');
        this.removeFiles(basePath);
        return zipStream
            .pipe(unzipper.Extract({ path: addonPath }))
            .promise()
        ;
    }

    uninstall(wowPath) {
        return Promise.resolve().then(() => this.removeFiles(wowPath));
    }
}

module.exports = Addon;
