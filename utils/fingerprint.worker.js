const WorkerUtils = require('../utils/worker-utils');
WorkerUtils.registerAsar();
const fs = require('fs');
const _ = WorkerUtils.getModule('lodash');
const path = require('path');
const { promisify } = require('util');
const U = WorkerUtils.getModule('uint32');
const { expose, isWorkerRuntime } = WorkerUtils.getModule('threads/worker');

const readFileAsync = promisify(fs.readFile);
const readdirAsync = promisify(fs.readdir);

const bindingsXmlRegex = /Bindings\.xml$/i;
const xmlCommentsRegex = /<!--[\s\S]*?-->/gm;
const xmlIncludesRegex = /<(?:Include|Script)\s+file=["']((?!\.\.).*)["']\s*\/>/gi;
const tocFileRegex = /.toc$/i;
const tocCommentsRegex = /\s*#.*$/gm;
const tocIncludesRegex = /^\s*((?!\.\.).+\.(?:xml|lua))\s*$/gmi;

function isWhitespace(chr) {
    return chr === 9 || chr === 10 || chr === 13 || chr === 32;
}

function uMult(a, b) {
    const buffer = new Uint32Array(2);
    U.mult(a, b, buffer);
    return buffer[1];
}

function lengthWithoutWhitespace(buffer) {
    return _.sumBy(buffer, chr => !isWhitespace(chr));
}

function getFileHash(filePath, ignoreWhitespace) {
    return readFileAsync(filePath)
        .then(content => getHash(content, undefined, ignoreWhitespace))
    ;
}

function getNormalisedFileHash(filePath) {
    return getFileHash(filePath, true);
}

function getHash(buffer, length, ignoreWhitespace) {
    const num1 = length || (ignoreWhitespace ? lengthWithoutWhitespace(buffer) : buffer.length);
    let num2 = U.xor(1, num1);
    let num3 = null;
    let num4 = null;
    let num6 = null;
    let num7 = null;
    for(let i = 0; i < buffer.length; i++) {
        const chr = buffer[i];
        if(!ignoreWhitespace || !isWhitespace(chr)) {
            num3 = num3 | U.shiftLeft(chr, num4);
            num4 += 8;
            if(num4 === 32) {
                num6 = uMult(num3, 1540483477);
                num7 = uMult(U.xor(num6, U.shiftRight(num6, 24)), 1540483477);
                num2 = U.xor(uMult(num2, 1540483477), num7);
                num3 = 0;
                num4 = 0;
            }
        }
    }
    if(num4 > 0) {
        num2 = uMult(U.xor(num2, num3), 1540483477);
    }
    num6 = uMult(U.xor(num2, U.shiftRight(num2, 13)), 1540483477);
    return U.xor(num6, U.shiftRight(num6, 15));
}

function removeTocComments(toc) {
    return toc.replace(tocCommentsRegex, '');
}

function removeXmlComments(xml) {
    return xml.replace(xmlCommentsRegex, '');
}

function getTocIncludes(toc) {
    return _.map(
        Array.from(removeTocComments(toc).matchAll(tocIncludesRegex)),
        '1'
    );
}

function getXmlIncludes(xml) {
    return _.map(
        Array.from(removeXmlComments(xml).matchAll(xmlIncludesRegex)),
        '1'
    );
}

function getIncludes(indexFile, matchingFiles) {
    if(_.includes(matchingFiles, indexFile)) {
        return;
    }
    matchingFiles.push(indexFile);
    return readFileAsync(indexFile, 'utf8')
        .then(content => {
            let includes = null;
            if(indexFile.toLowerCase().endsWith('.toc')) {
                includes = getTocIncludes(content);
            } else if(indexFile.toLowerCase().endsWith('.xml')) {
                includes = getXmlIncludes(content);
            }
            return Promise.all(_.map(
                includes,
                include => getIncludes(path.resolve(indexFile, '..', include), matchingFiles)
            ));
        })
        .then(() => matchingFiles);
}

function getMatchingFiles(addonPath) {
    const matchingFiles = [];
    return readdirAsync(addonPath)
        .then(allFiles => {
            const indexFiles = [];
            _.forEach(allFiles, file => {
                if(file.match(bindingsXmlRegex)) {
                    matchingFiles.push(path.resolve(addonPath, file));
                } else if(file.match(tocFileRegex)) {
                    indexFiles.push(file);
                }
            });
            return Promise.all(_.map(
                indexFiles,
                indexFile => getIncludes(path.resolve(addonPath, indexFile), matchingFiles)
            ));
        })
        .then(() => matchingFiles)
    ;
}


function getAddonDirFingerprint(path) {
    return getMatchingFiles(path)
        .then(matches => Promise.all(_.map(matches, getNormalisedFileHash)))
        .then(allHashes => _.join(_.sortBy(allHashes), ''))
        .then(concHash => getHash(Buffer.from(concHash)))
    ;
}

if(isWorkerRuntime) {
    expose(function(workerData) {
        return Promise.all(_.map(workerData, getAddonDirFingerprint));
    });
} else {
    module.exports = { getAddonDirFingerprint };
}
