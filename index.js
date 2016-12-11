
/**
 * globfs
 *
 * Copyright 2015-2016 David Herron
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
const async = require('async');
const fs    = require('fs-extra-promise');
const util  = require('util');
const path  = require('path');
const co    = require('co');

module.exports.operateAsync = function(basedirs, patterns, operation) {

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
		return Promise.reject(new Error('incorrect operation function given '+ util.inspect(operation)));
	}

	return co(function *() {
		for (let bsdirnum = 0; bsdirnum < basedirs.length; bsdirnum++) {
			let basedir = basedirs[bsdirnum];
			for (let patrnum = 0; patrnum < patterns.length; patrnum++) {
				let pattern = patterns[patrnum];
				let files = yield new Promise((resolve, reject) => {
					glob(pattern, { cwd: basedir },
						function(errGlob, files) {
							if (errGlob) reject(errGlob);
							else resolve(files);
						});
				});
                // console.log(`operateAsync ${util.inspect(files)}`);
				for (let filenum = 0; filenum < files.length; filenum++) {
					let fpath = files[filenum];
					// console.log(`operate checking ${basedir} ${fpath}`);
					let fresult = yield new Promise((resolve, reject) => {
						operation(basedir, fpath, (errOp, result) => {
							// console.log(`operateAsync finished operation result= ${basedir} ${fpath} ${util.inspect(errOp)} ${util.inspect(result)}`);
							if (errOp) {
								resolve({
									error: errOp,
									basedir: basedir,
									path: fpath,
									fullpath: path.join(basedir, fpath)
								});
							} else if (result) {
								resolve({
									basedir: basedir,
									path: fpath,
									fullpath: path.join(basedir, fpath),
									result: result
								});
							}
							// If no result given, don't include in results
							resolve(null);
						});
					});
                    // console.log(`operateAsync finished loop ${basedir} ${fpath} ${util.inspect(fresult)}`);
                    // console.log(`operateAsync ${util.inspect(files)}`);
					if (fresult !== null) results.push(fresult);
				}
			}
		}
		// console.log(`operateAsync RESULTS ${util.inspect(results)}`);
		return results;
	});
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
}

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

module.exports.copyAsync = function(basedirs, patterns, destdir, options) {

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
		return Promise.reject(new Error('incorrect destdir given '+ util.inspect(destdir)));
	}

	return co(function *() {
		var files2copy = yield module.exports.operateAsync(basedirs, patterns);
		var results = "";
		for (var copynum = 0; copynum < files2copy.length; copynum++) {
			var tocopy = files2copy[copynum];
			// console.log(`copy ${util.inspect(tocopy)}`);
			var fnCopyFrom = path.join(tocopy.basedir, tocopy.path);
			var fnCopyTo   = path.join(destdir, tocopy.path);
			var dirCopyTo  = path.dirname(fnCopyTo);

			var stats = yield fs.statAsync(fnCopyFrom);
			if (! stats.isFile()) continue;
			yield fs.mkdirsAsync(dirCopyTo);
			results += yield new Promise((resolve, reject) => {
				var rd = fs.createReadStream(fnCopyFrom);
				rd.on("error", function(err) {
					console.error('createReadStream '+ err);
				});
				var wr = fs.createWriteStream(fnCopyTo);
				wr.on("error", function(err) {
					// console.error('createWriteStream '+ err);
					reject(err);
				});
				wr.on("finish", function(ex) {
					resolve(options.verbose ? `COPY ${fnCopyFrom} ==> ${fnCopyTo}
` : '');
				});
				rd.pipe(wr);
			});
		}
		return results;
	});

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

module.exports.rmAsync = function(basedirs, patterns, options) {

	if (typeof basedirs === 'string') {
		var b = basedirs;
		basedirs = [ b ];
	}

	if (typeof patterns === 'string') {
		var p = patterns;
		patterns = [ p ];
	}

	if (typeof options === 'undefined') options = {};

	return co(function *() {
		var files2rm = yield module.exports.operateAsync(basedirs, patterns);
		var results = "";
		for (var rmnum = 0; rmnum < files2rm.length; rmnum++) {
			var torm = files2rm[rmnum];
			var fn2Remove = path.join(torm.basedir, torm.path);
			yield fs.unlinkAsync(fn2Remove);
			if (options.verbose) {
				results += `RM ${fn2Remove}
`;
			}
		}
		return results;
	});
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

module.exports.chmodAsync = function(basedirs, patterns, newmode, options) {
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
		return Promise.reject(new Error('incorrect newmode given '+ util.inspect(newmode)));
	}

	if (typeof options === 'undefined') options = {};

	return co(function *() {
		var files2chmod = yield module.exports.operateAsync(basedirs, patterns);
		var results = '';
		for (var chmodnum = 0; chmodnum < files2chmod.length; chmodnum++) {
			var tochmod = files2chmod[chmodnum];
			var fn2chmod = path.join(tochmod.basedir, tochmod.path);
			yield fs.chmodAsync(fn2chmod, newmode);
			if (options.verbose) {
				results += `CHMOD ${fn2chmod} ${newmode.toString(8)}
`;
			}
		}
		return results;
	});
};

module.exports.chmod = function(basedirs, patterns, newmode, options, done) {
	module.exports.chmodAsync(basedirs, patterns, newmode, options)
	.then(results => { done(undefined, results); })
	.catch(err => { done(err); });
};

module.exports.chownAsync = function(basedirs, patterns, uid, gid, options) {
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
		return Promise.reject(new Error('incorrect uid '+ util.inspect(uid) +' or gid '+ util.inspect(gid) +' given'));
	}

	return co(function *() {
		var files2chown = yield module.exports.operateAsync(basedirs, patterns);
		var results = '';
		for (var chownnum = 0; chownnum < files2chown.length; chownnum++) {
			var tochown = files2chown[chownnum];
			var fn2chown = path.join(tochown.basedir, tochown.path);
			yield fs.chownAsync(fn2chown, uid, gid);
			if (options.verbose) {
				results += `CHOWN ${fn2chown} ${uid} ${gid}
`;
			}
		}
		return results;
	});
};

module.exports.chown = function(basedirs, patterns, uid, gid, options, done) {
	module.exports.chownAsync(basedirs, patterns, uid, gid, options)
	.then(results => { done(undefined, results); })
	.catch(err => { done(err); });
};


module.exports.duAsync = function(basedirs, patterns, options) {
	if (typeof basedirs === 'string') {
		var b = basedirs;
		basedirs = [ b ];
	}

	if (typeof patterns === 'string') {
		var p = patterns;
		patterns = [ p ];
	}

	if (typeof options === 'undefined') options = {};

	return co(function *() {
		var totalsz = 0;
		var files2du = yield module.exports.operateAsync(basedirs, patterns);
		var sizes = '';
		// console.log(util.inspect(files2du));
		for (var dunum = 0; dunum < files2du.length; dunum++) {
			var todu = files2du[dunum];
			var fn2du = path.join(todu.basedir, todu.path);
			var stats = yield fs.statAsync(fn2du);
			sizes += `${fn2du} ${stats.size}
`;
			totalsz += stats.size;
		}
		return options.verbose ? (`${sizes}
TOTAL ${totalsz}`) : totalsz;
	});
};

module.exports.du = function(basedirs, patterns, options, done) {
	module.exports.duAsync(basedirs, patterns, options)
	.then(results => { done(undefined, results); })
	.catch(err => { done(err); });
};

// TODO:
//    ls
//    cat
//    find
