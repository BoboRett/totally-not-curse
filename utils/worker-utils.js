const path = require('path');

function registerAsar() {
    require('asar-node').register();
}

function getModule(module) {
    try {
        return require(module);
    } catch(err) {
        return require(path.resolve(__dirname, '../../app.asar/node_modules', module));
    }
}

function isDev() {
    return process.env.ELECTRON_DEV;
}

module.exports = {
    getModule,
    isDev,
    registerAsar
};
