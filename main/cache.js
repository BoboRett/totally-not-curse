const { app, webContents } = require('electron');
const fs = require('fs');
const path = require('path');
const Pbf = require('pbf');
const compile = require('pbf/compile');
const pbfSchema = require('protocol-buffers-schema');
const _ = require('lodash');

const schema = compile(pbfSchema.parse(fs.readFileSync(path.resolve(__dirname, '../schema.proto'))));

async function saveAddons(addons) {
    if(_.isNil(addons)) {
        const wc = webContents.getFocusedWebContents();
        addons = await wc.executeJavaScript('store.getState().addons');
    }
    const addonsCache = path.resolve(app.getPath('userData'), './addons.cache');
    const pbf = new Pbf();
    schema.Addons.write({ addons }, pbf);
    fs.writeFileSync(addonsCache, pbf.finish());
    return addons;
}

function loadAddons() {
    const addonsCache = path.resolve(app.getPath('userData'), './addons.cache');
    try {
        return schema.Addons.read(new Pbf(fs.readFileSync(addonsCache))).addons;
    } catch (err) {
        return [];
    }
}

module.exports = {
    addonSchema: schema.Addons,
    loadAddons,
    saveAddons
};
