const axios = require('axios');
const _ = require('lodash');
const { ADDON_RELEASE_TYPE } = require('./constants');

const curseAPI = 'https://addons-ecs.forgesvc.net/api/v2/';

function getAddonById(id) {
    return axios({
        baseURL: curseAPI,
        params: {
            gameId: 1
        },
        url: `/addon/${id}`
    }).then(({ data }) => data);
}

function getAddonsById(ids) {
    return axios({
        method: 'POST',
        baseURL: curseAPI,
        url: '/addon',
        data: ids
    }).then(({ data }) => data);
}

async function getAddonFile(addonId, fileId) {
    const manifest = await getAddonFileManifest(addonId, fileId);
    const file = await axios(manifest.downloadUrl, { responseType: 'stream' }).then(({ data }) => data);
    return { manifest, file };
}

function getAddonFileManifest(addonId, fileId) {
    return axios({
        method: 'GET',
        baseURL: curseAPI,
        url: `addon/${addonId}/file/${fileId}`
    }).then(({ data }) => data);
}

function getFileByFingerprint(fingerprint) {
    return axios({
        method: 'POST',
        baseURL: curseAPI,
        url: '/fingerprint',
        data: [fingerprint]
    }).then(({ data }) => data);
}

function getFilesByFingerprintOnce(fingerprints) {
    return axios({
        method: 'POST',
        baseURL: curseAPI,
        url: '/fingerprint',
        data: fingerprints
    }).then(({ data }) => data);
}

function getFilesByFingerprint(fingerprints, retries) {
    return getFilesByFingerprintOnce(fingerprints)
        .then(allFiles => {
            const hits = _.concat(allFiles.exactMatches, allFiles.partialMatches);
            const misses = allFiles.unmatchedFingerprints;
            if(misses.length && retries > 0) {
                return getFilesByFingerprint(misses, retries - 1)
                    .then(retriedFiles => {
                        return _.concat(hits, retriedFiles);
                    })
                ;
            } else {
                return hits;
            }
        })
    ;
}

function getLatestFile(addonId, releaseType = ADDON_RELEASE_TYPE.STABLE) {
    return getAddonById(addonId)
        .then(curseAddon => {
            return _.find(curseAddon.latestFiles, file => (
                file.releaseType === releaseType
                    && file.gameVersionFlavor === 'wow_retail'
            ));
        })
    ;
}

module.exports = {
    getAddonById,
    getAddonFile,
    getAddonFileManifest,
    getAddonsById,
    getFileByFingerprint,
    getFilesByFingerprint,
    getLatestFile
};
