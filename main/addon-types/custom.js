const { ADDON_TYPE, ADDON_RELEASE_TYPE } = require('../../utils/constants');
const Addon = require('./base');
const crypto = require('crypto');
const path = require('path');
const _ = require('lodash');

class CustomAddon extends Addon {
    constructor() {
        super(ADDON_TYPE.CUSTOM, ...arguments);
    }

    static checkForUpdates(addons) {
        return _.mapValues(_.keyBy(addons, 'id'), () => false);
    }

    static fromDirs(wowPath, dirs) {
        return _.transform(dirs, (matches, dir) => {
            const addon = new CustomAddon(
                dir,
                parseInt(crypto.randomBytes(5).join('')),
                [{ foldername: dir }],
                ADDON_RELEASE_TYPE.STABLE,
                '-',
                'custom',
                'Custom addon'
            );
            addon.url = path.join(wowPath, 'Interface/addons', dir);
            matches.matched.push(addon);
        }, { matched: [], unmatched: [] });
    }

    static fromState(state) {
        return new CustomAddon(
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

    update() {
        throw new Error('Attempting to update custom addon');
    }
}

module.exports = CustomAddon;
