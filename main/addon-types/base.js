const { ADDON_STATUS, ADDON_RELEASE_TYPE } = require('../../utils/constants');
const fse = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');
const _ = require('lodash');

class Addon {
    constructor(type, name, id, folders, releaseType, version, summary, url, authors) {
        if(new.target === Addon) {
            throw new TypeError('Cannot construct Abstract instance');
        }
        this.type = type;
        this.name = name;
        this.id = id;
        this.folders = folders || [];
        this.authors = authors || [];
        this.summary = summary || '';
        this.url = url || '';
        this.setReleaseType(releaseType || ADDON_RELEASE_TYPE.STABLE);
        this.setVersion(version || '1.0.0');
        this.setStatus(ADDON_STATUS.OK);
    }

    removeFiles(basePath) {
        const addonPath = path.join(basePath, 'Interface/addons');
        _.forEach(this.folders, folder => {
            fse.removeSync(path.join(addonPath, folder.foldername));
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

    setReleaseType(releaseType) {
        this.releaseType = releaseType;
    }

    setStatus(status) {
        this.status = status;
    }

    setVersion(version) {
        this.version = version;
    }

    uninstall(wowPath) {
        return Promise.resolve().then(() => this.removeFiles(wowPath));
    }

    update() {}
}

module.exports = Addon;
