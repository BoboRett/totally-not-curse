const { ipcMain } = require('electron');
const { exec } = require('child_process');
const fs = require('fs');

const getQueryString = () => {
    switch(process.arch) {
        case 'x64':
            return 'REG QUERY "HKLM\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\World of Warcraft"';
        default:
            return 'REG QUERY "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\World of Warcraft"';
    }
};

function getInstallDir() {
    return new Promise((res, rej) => {
        exec(getQueryString(), (err, stdout) => {
            err && rej(err);
            const regValue = stdout.split('\n').map(ln => ln.trim()).reduce((acc, ln) => {
                const pieces = ln.split('    ');
                acc[pieces[0]] = pieces[2];
                return acc;
            }, {});
            res(regValue.InstallLocation);
        });
    });
}

function getVersionDirs(wowDir) {
    return new Promise((res, rej) => {
        fs.readdir(wowDir, (err, files) => {
            err && rej(err);
            const getPath = key => files.includes(key) && wowDir.concat('\\' + key);
            res({
                wow_beta: getPath('_beta_'),
                wow_ptr: getPath('_ptr_'),
                wow_retail: getPath('_retail_'),
                wow_classic: getPath('_classic_')
            });
        });
    });
}

function handle() {
    ipcMain.handle('findWow', () => {
        return getInstallDir()
            .then(getVersionDirs)
        ;
    });
}

module.exports = { handle };
