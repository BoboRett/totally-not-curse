const { ADDON_STATUS, ADDON_RELEASE_TYPE } = require('../../utils/constants');
const fse = require('fs-extra');
const path = require('path');
const unzipper = require('unzipper');
const _ = require('lodash');

class Addon {
    constructor(type, name, id, folders, releaseType, version, summary, url) {
        if(new.target === Addon) {
            throw new TypeError('Cannot construct Abstract instance');
        }
        this.type = type;
        this.name = name;
        this.id = id;
        this.folders = folders || [];
        this.summary = summary || '';
        this.url = url || '';
        this.setReleaseType(releaseType || ADDON_RELEASE_TYPE.STABLE);
        this.setVersion(version || '1.0.0');
        this.setStatus(ADDON_STATUS.OK);
    }

    replaceFiles(zipStream, basePath, progressReporter) {
        const addonPath = path.join(basePath, 'Interface/addons');
        const addonId = _.toString(this.id);
        progressReporter.send(addonId, { updateProgress: 0 });
        _.forEach(this.folders, folder => {
            fse.removeSync(path.join(addonPath, folder.foldername));
        });
        progressReporter.send(addonId, { updateProgress: 0.5 });
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

    update() {}
}

module.exports = Addon;
