const ADDON_TYPE = {
    REMOVED: -1,
    CUSTOM: 0,
    CURSE: 1
};

const ADDON_RELEASE_TYPE = {
    STABLE: 1,
    BETA: 2,
    ALPHA: 3
};

const ADDON_STATUS = {
    OK: 0,
    UPDATE_AVAIL: 1,
    UPDATE_WAIT: 2,
    UPDATE_PROG: 3
};

module.exports = { ADDON_TYPE, ADDON_RELEASE_TYPE, ADDON_STATUS };
