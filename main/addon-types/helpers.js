const { ADDON_TYPE } = require("../../utils/constants");
const CurseAddon = require("./curse");
const CustomAddon = require("./custom");
const _ = require('lodash');

const TypeMap = {
    '-1': CurseAddon,
    '0': CustomAddon,
    '1': CurseAddon
};

function parseCache(cached) {
    return _.map(cached, fromState);
}

async function taskPerAddonGroup(addons, task, ...args) {
    const addonByType = _.groupBy(addons, 'type');
    const results = {};
    return Promise.all(_.map(addonByType, (addons, type) => (
        Promise.resolve()
            .then(() => _.invoke(TypeMap[type], task, addons, ...args))
            .then(result => { results[type] = result; })
    )))
        .then(() => results)
    ;
}

function fromDirs(wowPath, dirs, progressReporter) {
    let allAddons = [];
    return CurseAddon.fromDirs(wowPath, dirs, progressReporter)
        .then(matches => {
            allAddons = _.concat(allAddons, matches.matched);
            return matches.unmatched;
        })
        .then(addons => CustomAddon.fromDirs(wowPath, addons, progressReporter))
        .then(matches => {
            allAddons = _.concat(allAddons, matches.matched);
            return allAddons;
        })
    ;
}

function fromState(addon) {
    switch(addon.type) {
        case ADDON_TYPE.REMOVED:
            return _.assign(
                CurseAddon.fromState(addon),
                { type: ADDON_TYPE.REMOVED }
            );
        case ADDON_TYPE.CUSTOM:
            return CustomAddon.fromState(addon);
        case ADDON_TYPE.CURSE:
            return CurseAddon.fromState(addon);
        default:
            // unknown
            throw new TypeError(`Unknown addon type: ${addon.name}`);
    }
}

module.exports = {
    fromDirs,
    fromState,
    parseCache,
    taskPerAddonGroup
};
