
/**
 * globfs
 *
 * Copyright 2015-2017 David Herron
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

'use strict';

const glob  = require('glob');
const fs    = require('fs-extra');
const util  = require('util');
const path  = require('path');

function doTracing() {
    return (typeof process.env.GLOBFS_TRACE !== 'undefined'
     && process.env.GLOBFS_TRACE !== ""
     && (
         process.env.GLOBFS_TRACE === "1"
      || process.env.GLOBFS_TRACE === "yes"
      || process.env.GLOBFS_TRACE === "true"
     ));
}

/**
 * Glob based generic file operations from single or multiple source directories, and against
 * single or multiple glob patterns.
 *
 * The signature for "operation" is function(basedir, path, function(err, result)).
 */
module.exports.operateAsync = async function(basedirs, patterns, operation) {

    var results = [];

    if (typeof basedirs === 'string') {
        var b = basedirs;
        basedirs = [ b ];
    }

    if (typeof patterns === 'string') {
        var p = patterns;
        patterns = [ p ];
    }

    if (typeof operation === 'undefined') {
        operation = (basedir, fpath, fini) => { fini(null, fpath); };
    }
    if (typeof operation !== 'function') {
        throw new Error('incorrect operation function given '+ util.inspect(operation));
    }

    var trace = doTracing();

    for (let basedir of basedirs) {
        for (let pattern of patterns) {
            let files = await new Promise((resolve, reject) => {
                glob(pattern, { cwd: basedir },
                    function(errGlob, files) {
                        if (errGlob) reject(errGlob);
                        else resolve(files);
                    });
            });
            // console.log(`operateAsync ${util.inspect(files)}`);
            for (let fpath of files) {
                // console.log(`operate checking ${basedir} ${fpath}`);
                let op_start = undefined;
                if (trace) {
                    op_start = new Date();
                }
                let fresult = await new Promise((resolve, reject) => {
                    try {
                        operation(basedir, fpath, async (errOp, result) => {
                            // console.log(`operateAsync finished operation result= ${basedir} ${fpath} ${util.inspect(errOp)} ${util.inspect(result)}`);
                            let op_end = trace ? new Date() : undefined;
                            let op_elapsed = trace ? (op_end - op_start) : undefined;
                            if (errOp) {
                                resolve({
                                    error: errOp,
                                    basedir: basedir,
                                    path: fpath,
                                    fullpath: path.join(basedir, fpath),
                                    start: op_start,
                                    end: op_end,
                                    elapsed: op_elapsed
                                });
                            } else if (result) {
                                resolve({
                                    basedir: basedir,
                                    path: fpath,
                                    fullpath: path.join(basedir, fpath),
                                    stats: await fs.stat(path.join(basedir, fpath)),
                                    result: result,
                                    start: op_start,
                                    end: op_end,
                                    elapsed: op_elapsed
                                });
                            }
                            // If no result given, don't include in results
                            resolve(null);
                        });
                    } catch (err) { reject(err); }
                });
                // console.log(`operateAsync finished loop ${basedir} ${fpath} ${util.inspect(fresult)}`);
                // console.log(`operateAsync ${util.inspect(files)}`);
                if (fresult !== null) results.push(fresult);
            }
        }
    }
    // console.log(`operateAsync RESULTS ${util.inspect(results)}`);
    return results;
};

/**
 * Glob based generic file operations from single or multiple source directories, and against
 * single or multiple glob patterns.
 *
 * The signature for "operation" is function(basedir, path, function(err, result)).
 */
module.exports.operate = function(basedirs, patterns, operation, done) {
    module.exports.operateAsync(basedirs, patterns, operation)
        .then(results => { done(undefined, results); })
        .catch(err => { done(err); });
};

module.exports.findAsync = function(basedirs, patterns) {
    if (typeof basedirs === 'string') {
        var b = basedirs;
        basedirs = [ b ];
    }

    if (typeof patterns === 'string') {
        var p = patterns;
        patterns = [ p ];
    }

    return module.exports.operateAsync(basedirs, patterns);
};

module.exports.find = function(basedirs, patterns, done) {
    module.exports.findAsync(basedirs, patterns)
        .then(results => { done(undefined, results); })
        .catch(err => { done(err); });
};

module.exports.findSync = function(basedirs, patterns) {
    if (typeof basedirs === 'string') {
        var b = basedirs;
        basedirs = [ b ];
    }

    if (typeof patterns === 'string') {
        var p = patterns;
        patterns = [ p ];
    }

    var ret = [];
    for (var basedir of basedirs) {
        for (var pattern of patterns) {
            var filez = glob.sync(pattern, { cwd: basedir });
            // console.log(`globfs findSync ${basedir} ${pattern} found ${util.inspect(filez)}`);
            for (var fpath of filez) {
                ret.push({
                    basedir: basedir,
                    path: fpath,
                    fullpath: path.join(basedir, fpath)
                });
            }
        }
    }
    return ret;
};

module.exports.copyAsync = async function(basedirs, patterns, destdir, options) {

    // util.log('copy '+ util.inspect(basedirs) +' '+ util.inspect(patterns) +' '+ destdir);

    if (typeof basedirs === 'string') {
        var b = basedirs;
        basedirs = [ b ];
    }

    if (typeof patterns === 'string') {
        var p = patterns;
        patterns = [ p ];
    }

    if (typeof options === 'undefined') options = {};

    if (typeof destdir !== 'string') {
        throw new Error('incorrect destdir given '+ util.inspect(destdir));
    }

    var files2copy = await module.exports.operateAsync(basedirs, patterns);
    var results = "";
    for (var tocopy of files2copy) {
        // console.log(`copy ${util.inspect(tocopy)}`);
        var fnCopyFrom = path.join(tocopy.basedir, tocopy.path);
        var fnCopyTo   = path.join(destdir, tocopy.path);
        var dirCopyTo  = path.dirname(fnCopyTo);

        var stats = await fs.stat(fnCopyFrom);
        if (! stats.isFile()) continue;
        await fs.mkdirs(dirCopyTo);
        results += await new Promise((resolve, reject) => {
            var rd = fs.createReadStream(fnCopyFrom);
            /* eslint-disable no-console */
            rd.on("error", function(err) {
                console.error('WARN: createReadStream '+ err);
            });
            /* eslint-enable no-console */
            var wr = fs.createWriteStream(fnCopyTo);
            wr.on("error", function(err) {
                // console.error('createWriteStream '+ err);
                reject(err);
            });
            /* eslint-disable no-unused-vars */
            wr.on("finish", function(ex) {
                resolve(options.verbose ? `COPY ${fnCopyFrom} ==> ${fnCopyTo}
` : '');
            });
            /* eslint-enable no-unused-vars */
            rd.pipe(wr);
        });
    }

    return results;

};

/**
 * Glob based file copying from single or multiple source directories, and against
 * single or multiple glob patterns.
 *
 * The options argument is currently ignored but is suggested to allow caller to
 * tailor the precise actions.
 */

module.exports.copy = function(basedirs, patterns, destdir, options, done) {
    module.exports.copyAsync(basedirs, patterns, destdir, options)
        .then(results => { done(undefined, results); })
        .catch(err => { done(err); });
};

module.exports.rmAsync = async function(basedirs, patterns, options) {

    if (typeof basedirs === 'string') {
        var b = basedirs;
        basedirs = [ b ];
    }

    if (typeof patterns === 'string') {
        var p = patterns;
        patterns = [ p ];
    }

    if (typeof options === 'undefined') options = {};

    var files2rm = await module.exports.operateAsync(basedirs, patterns);
    var results = "";
    for (var torm of files2rm) {
        var fn2Remove = path.join(torm.basedir, torm.path);
        var stats = await fs.stat(fn2Remove);
        if (! stats.isFile()) continue;
        await fs.unlink(fn2Remove);
        if (options.verbose) {
            results += `RM ${fn2Remove}
`;
        }
    }
    return results;
};

/**
 * Glob based file deletion from single or multiple source directories, and against
 * single or multiple glob patterns.
 *
 * The options argument is currently ignored but is suggested to allow caller to
 * tailor the precise actions.
 */

module.exports.rm = function(basedirs, patterns, options, done) {
    module.exports.rmAsync(basedirs, patterns, options)
        .then(results => { done(undefined, results); })
        .catch(err => { done(err); });
};

module.exports.chmodAsync = async function(basedirs, patterns, newmode, options) {
    if (typeof basedirs === 'string') {
        var b = basedirs;
        basedirs = [ b ];
    }

    if (typeof patterns === 'string') {
        var p = patterns;
        patterns = [ p ];
    }

    if (typeof newmode === 'string') newmode = parseInt(newmode, 8);
    if (typeof newmode !== 'number') {
        throw new Error('incorrect newmode given '+ util.inspect(newmode));
    }

    if (typeof options === 'undefined') options = {};

    var files2chmod = await module.exports.operateAsync(basedirs, patterns);
    var results = '';
    for (var tochmod of files2chmod) {
        var fn2chmod = path.join(tochmod.basedir, tochmod.path);
        await fs.chmod(fn2chmod, newmode);
        if (options.verbose) {
            results += `CHMOD ${fn2chmod} ${newmode.toString(8)}
`;
        }
    }
    return results;
};

module.exports.chmod = function(basedirs, patterns, newmode, options, done) {
    module.exports.chmodAsync(basedirs, patterns, newmode, options)
        .then(results => { done(undefined, results); })
        .catch(err => { done(err); });
};

module.exports.chownAsync = async function(basedirs, patterns, uid, gid, options) {
    if (typeof basedirs === 'string') {
        var b = basedirs;
        basedirs = [ b ];
    }

    if (typeof patterns === 'string') {
        var p = patterns;
        patterns = [ p ];
    }

    if (typeof options === 'undefined') options = {};

    if (typeof uid === 'string') uid = parseInt(uid);
    if (typeof gid === 'string') gid = parseInt(gid);
    if (typeof uid !== 'number' || typeof gid !== 'number') {
        throw new Error('incorrect uid '+ util.inspect(uid) +' or gid '+ util.inspect(gid) +' given');
    }

    var files2chown = await module.exports.operateAsync(basedirs, patterns);
    var results = '';
    for (var tochown of files2chown) {
        var fn2chown = path.join(tochown.basedir, tochown.path);
        await fs.chown(fn2chown, uid, gid);
        if (options.verbose) {
            results += `CHOWN ${fn2chown} ${uid} ${gid}
`;
        }
    }
    return results;
};

module.exports.chown = function(basedirs, patterns, uid, gid, options, done) {
    module.exports.chownAsync(basedirs, patterns, uid, gid, options)
        .then(results => { done(undefined, results); })
        .catch(err => { done(err); });
};


module.exports.duAsync = async function(basedirs, patterns, options) {
    if (typeof basedirs === 'string') {
        var b = basedirs;
        basedirs = [ b ];
    }

    if (typeof patterns === 'string') {
        var p = patterns;
        patterns = [ p ];
    }

    if (typeof options === 'undefined') options = {};

    var totalsz = 0;
    var files2du = await module.exports.operateAsync(basedirs, patterns);
    var sizes = '';
    // console.log(util.inspect(files2du));
    for (var todu of files2du) {
        var fn2du = path.join(todu.basedir, todu.path);
        var stats = await fs.stat(fn2du);
        sizes += `${fn2du} ${stats.size}
`;
        totalsz += stats.size;
    }
    return options.verbose ? (`${sizes}
TOTAL ${totalsz}`) : totalsz;
};

module.exports.du = function(basedirs, patterns, options, done) {
    module.exports.duAsync(basedirs, patterns, options)
        .then(results => { done(undefined, results); })
        .catch(err => { done(err); });
};

// TODO:
//    ls
//    cat
