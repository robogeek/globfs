
var glob  = require('glob');
var async = require('async');
var fs    = require('fs-extra');
var util  = require('util');
var path  = require('path');

/**
 * Glob based generic file operations from single or multiple source directories, and against
 * single or multiple glob patterns.
 *
 * The signature for "operation" is function(basedir, path, function(err, result)).
 */
module.exports.operate = function(basedirs, patterns, operation, done) {

	var results = [];
	
	if (typeof basedirs === 'string') {
		var b = basedirs;
		basedirs = [ b ];
	}

	if (typeof patterns === 'string') {
		var p = patterns;
		patterns = [ p ];
	}
	
	if (typeof operation !== 'function') {
		done(new Error('incorrect operation function given '+ util.inspect(operation)));
	} else {
	
		async.eachSeries(basedirs,
		function(basedir, nextBasedir) {
			async.eachSeries(patterns,
			function(pattern, nextPattern) {
		
				glob(pattern, {
					cwd: basedir
				},
				function(errGlob, files) {
					if (errGlob) { 
						// util.error(err);
						nextPattern(errGlob);
					} else { 
					
						async.eachLimit(files, 10,
						function(fpath, nextFile) {
				
							operation(basedir, fpath, function(errOp, result) {
								if (errOp) {
									results.push({
										error: errOp,
										basedir: basedir,
										path: fpath,
										fullpath: path.join(basedir, fpath)
									});
								} else if (result) {
									results.push({
										basedir: basedir,
										path: fpath,
										fullpath: path.join(basedir, fpath),
										result: result
									});
								}
								// If no result given, don't include in results
								nextFile();
							});
						},
						function(errOnFile) {
							if (errOnFile) nextPattern(errOnFile);
							else nextPattern();
						});
					
					}
				});
		
			},
			function(errOnPattern) {
				if (errOnPattern) nextBasedir(errOnPattern);
				else nextBasedir();
			});
		},
		function(errOnBasedir) {
			if (errOnBasedir) done(errOnBasedir);
			else done(null, results);
		});
	}
};


/**
 * Glob based file copying from single or multiple source directories, and against
 * single or multiple glob patterns.
 *
 * The options argument is currently ignored but is suggested to allow caller to
 * tailor the precise actions.
 */

module.exports.copy = function(basedirs, patterns, destdir, options, done) {
	if (typeof basedirs === 'string') {
		var b = basedirs;
		basedirs = [ b ];
	}

	if (typeof patterns === 'string') {
		var p = patterns;
		patterns = [ p ];
	}

	if (typeof options === 'function') {
		done = options;
		options = { };
	}
	
	if (typeof destdir !== 'string') {
		done(new Error('incorrect destdir given '+ util.inspect(destdir)));
	} else {
	
		module.exports.operate(basedirs, patterns,
			function(basedir, fpath, fini) {
				fini(null, fpath);
			},
			function(err, files2copy) {
				if (err) done(err);
				else {
					async.eachLimit(files2copy, 10,
					function(tocopy, next2copy) {
					
						var fnCopyFrom = path.join(tocopy.basedir, tocopy.path);
						var fnCopyTo   = path.join(destdir, tocopy.path);
						var dirCopyTo  = path.dirname(fnCopyTo);
			
						fs.stat(fnCopyFrom, function(errStat, stats) {
							if (errStat) next2copy(errStat);
							else if (! stats.isFile()) next2copy();
							else {
								fs.mkdirs(dirCopyTo, function(err) {
									if (err) { util.error('mkdirs '+ err); }
									else {
					
										// util.log('copy '+ fnCopyFrom +' to '+ fnCopyTo);
					
										var rd = fs.createReadStream(fnCopyFrom);
										rd.on("error", function(err) {
											util.error('createReadStream '+ err);
										});
										var wr = fs.createWriteStream(fnCopyTo);
										wr.on("error", function(err) {
											util.error('createWriteStream '+ err);
											next2copy(err);
										});
										wr.on("finish", function(ex) {
											next2copy();
										});
										rd.pipe(wr);
									}
								});
							}
						});
					
					},
					function(errOnCopy) {
						if (errOnCopy) done(errOnCopy);
						else done();
					});
				}
			});
	}
};

/**
 * Glob based file deletion from single or multiple source directories, and against
 * single or multiple glob patterns.
 *
 * The options argument is currently ignored but is suggested to allow caller to
 * tailor the precise actions.
 */

module.exports.rm = function(basedirs, patterns, options, done) {
	if (typeof basedirs === 'string') {
		var b = basedirs;
		basedirs = [ b ];
	}

	if (typeof patterns === 'string') {
		var p = patterns;
		patterns = [ p ];
	}

	if (typeof options === 'function') {
		done = options;
		options = { };
	}

	module.exports.operate(basedirs, patterns,
		function(basedir, fpath, fini) {
			fini(null, fpath);
		},
		function(err, files2rm) {
			if (err) done(err);
			else {
				async.eachLimit(files2rm, 10,
				function(torm, next2rm) {
					var fn2Remove = path.join(torm.basedir, torm.path);
					fs.unlink(fn2Remove, function(errOnUnlink) {
						if (errOnUnlink) next2rm(errOnUnlink);
						else next2rm();
					});
				},
				function(errOnRemove) {
					if (errOnRemove) done(errOnRemove);
					else done();
				});
			}
		});
};

module.exports.chmod = function(basedirs, patterns, newmode, options, done) {
	if (typeof basedirs === 'string') {
		var b = basedirs;
		basedirs = [ b ];
	}

	if (typeof patterns === 'string') {
		var p = patterns;
		patterns = [ p ];
	}

	if (typeof options === 'function') {
		done = options;
		options = { };
	}
	
	if (typeof newmode !== 'number') {
		done(new Error('incorrect newmode given '+ util.inspect(destdir)));
	} else {
	
		module.exports.operate(basedirs, patterns, 
			function(basedir, fpath, fini) {
				fini(null, fpath);
			},
			function(err, files2chmod) {
				if (err) done(err);
				else {
					async.eachLimit(files2chmod, 10,
					function(tochmod, next2chmod) {
						var fn2chmod = path.join(tochmod.basedir, tochmod.path);
						fs.chmod(fn2chmod, newmode, function(errOnOp) {
							if (errOnOp) next2chmod(errOnOp);
							else next2chmod();
						});
					},
					function(errOnChmod) {
						if (errOnChmod) done(errOnChmod);
						else done();
					});
				}
			});
	}
};

module.exports.chown = function(basedirs, patterns, uid, gid, options, done) {
	if (typeof basedirs === 'string') {
		var b = basedirs;
		basedirs = [ b ];
	}

	if (typeof patterns === 'string') {
		var p = patterns;
		patterns = [ p ];
	}

	if (typeof options === 'function') {
		done = options;
		options = { };
	}
	
	if (typeof uid !== 'number' || typeof gid !== 'number') {
		done(new Error('incorrect uid '+ util.inspect(uid) +' or gid '+ util.inspect(gid) +' given'));
	} else {
	
		module.exports.operate(basedirs, patterns, 
			function(basedir, fpath, fini) {
				fini(null, fpath);
			},
			function(err, files2chown) {
				if (err) done(err);
				else {
					async.eachLimit(files2chown, 10,
					function(tochown, next2chown) {
						var fn2chown = path.join(tochown.basedir, tochown.path);
						fs.chown(fn2chown, uid, gid, function(errOnOp) {
							if (errOnOp) next2chown(errOnOp);
							else next2chown();
						});
					},
					function(errOnChown) {
						if (errOnChown) done(errOnChown);
						else done();
					});
				}
			});
	}
};


