# globfs
Useful functions for dealing with files, selecting them by "glob" patterns.

This Node.js module is an addon to the 'fs' module allowing the programmer to select files using glob patterns, acting on those files.

# Installation

    npm install --save globfs

# Usage

In your application, put this at the top

    var globfs = require('globfs');

# Methods

    operate(basedirs, patterns, operation, done)

This is a base method from which one can implement many other methods.  It also introduced a couple concepts used in the rest of the methods.

The `basedirs` argument is a list of directories to search.  This can either be a String, or an Array of String's.

The `patterns` argument is a list of glob patterns with which to search.  This can either be a String, or an Array of String's.

The `operation` argument is a callback function provided by the caller with the signature `function(basedir, fpath, fini)` and is called on each file matched by the glob's.  The function is required to call the `fini` function with the signature `function(err, result)`.  The overall purpose is to collect a subset of the files matched by the glob.  To include the file in that list, ensure the `result` parameter is non-null, or make it null to eliminate that file.

The `done` argument is a callback function provided by the caller which is called once `operate` is finished.  It has the signature `function(err, results)`.  The results object is an Array containing information about each matching file.  

Each array element is an object with fields

* __error__ non-null if an error occurred on the file
* __basedir__ the directory within which the file was found
* __path__ the pathname of the file within `basedir`
* __fullpath__ the result of `path.join(basedir, path)`
* __result__ the `result` object provided by the `operate` callback above

For example: 

    globfs.operate(basedirs, patterns,
		function(basedir, fpath, fini) { fini(null, fpath); },
		function(err, results) {
			util.log(util.inspect(results));
		});

collects all files matching the patterns within the basedirs.

    copy(basedirs, patterns, destdir, options, done)

Copies files from the `basedirs` directories (as above) matching one of the `patterns` (as above) to `destdir`.

The `options` argument is currently ignored but is meant to be an object tailoring the behavior.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err)`.

    globfs.copy('node_modules', [ '**/*.md', '**/*.js' ], 'n2',
		function(err) {
			if (err) util.error(err);
			else util.log('done');
		});

Copies just files with extension `.md` or `.js` into the directory named `n2`.

    globfs.copy('node_modules', [ '**/*', '**/.*/*', '**/.*' ], 'n2all',
		function(err) {
			if (err) util.error(err);
			else util.log('done');
		});

Copies ALL files into the directory named `n2all`.

    rm(basedirs, patterns, options, done)

Deletes files from the `basedirs` directories (as above) matching one of the `patterns` (as above).

The `options` argument is currently ignored but is meant to be an object tailoring the behavior.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err)`.

    globfs.rm('n2all', '**/*.js',
		function(err) {
			if (err) util.error(err);
			else util.log('done');
		});

Deletes just the files with the extension `.js` from the directory `n2all`.

    chmod(basedirs, patterns, newmode, options, done)
    chown(basedirs, patterns, uid, gid, options, done)

Changes file permissions or file ownership of files in the `basedirs` directories (as above) matching one of the `patterns` (as above).

The `options` argument is currently ignored but is meant to be an object tailoring the behavior.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err)`.

    globfs.chmod('n2all', '**/*.js', 0444,
		function(err) {
			if (err) util.error(err);
			else util.log('done');
		});

Changes permissions to read-only for all files with extension `.js` in the directory `n2all`.

    globfs.chown('n2all', '**/*.js', 666, 666,
		function(err) {
			if (err) util.error(err);
			else util.log('done');
		});

Changes the ownership of files with extension `.js` in the directory `n2all` to uid=666 and gid=666.
