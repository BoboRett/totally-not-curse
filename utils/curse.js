const axios = require('axios');

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

function getFileByFingerprint(fingerprint) {
    return axios({
        method: 'POST',
        baseURL: curseAPI,
        url: '/fingerprint',
        data: [fingerprint]
    }).then(({ data }) => data);
}

function getFilesByFingerprint(fingerprints) {
    return axios({
        method: 'POST',
        baseURL: curseAPI,
        url: '/fingerprint',
        data: fingerprints
    }).then(({ data }) => data);
}

module.exports = {
    getAddonById,
    getAddonsById,
    getFileByFingerprint,
    getFilesByFingerprint
};
