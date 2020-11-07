const axios = require('axios');
const _ = require('lodash');

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

module.exports = {
    getAddonById,
    getAddonFileManifest,
    getAddonsById,
    getFileByFingerprint,
    getFilesByFingerprint
};
