# globfs
Useful functions for dealing with files, selecting them by "glob" patterns.

This Node.js module is an addon to the 'fs' module allowing the programmer to select files using glob patterns, acting on those files.

# Installation

    npm install --save globfs

# Usage

In your application, put this at the top

    var globfs = require('globfs');

There is also a command line tool, globfs, that's invoked this way:

```
$ globfs --help

  Usage: globfs [options] [command]

  Commands:

    copy <srcdir> <destdir> [patterns...]  Copy stuff from one directory to another
    rm <dir> [patterns...]                 Delete stuff in a directory
    chmod <dir> <newmode> [patterns...]    Change permissions of stuff in a directory
    chown <dir> <uid> <gid> [patterns..]   Change ownership of stuff in a directory

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

These commands correspond to the methods documented below.  

# Methods

    globfs.operate(basedirs, patterns, operation, done)

This is a base method from which one can implement many other methods.  It also introduced a couple concepts used in the rest of the methods.

The `basedirs` argument is a list of directories to search.  This can either be a String, or an Array of String's.

The `patterns` argument is a list of glob patterns with which to search.  This can either be a String, or an Array of String's.

The `operation` argument is a callback function provided by the caller with the signature `function(basedir, fpath, fini)` and is called on each file matched by the glob's.  The function is required to call the `fini` function with the signature `function(err, result)`.  

The `fini` function indicates one of two things :- 

* Is there an error with that file
* Allows the caller to process the file and supply some data

The `operate` function collects all `result` objects, supplying them through the `done` method.  If the called function does not supply a `result` object, then the file is eliminated from the results array.  Hence, this is the minimal `fini` function:

    globfs.operate(..., ..., function(basedir, fpath, fini) { fini(null, fpath); }, ...);

The `done` argument is a callback function provided by the caller which is called once `operate` is finished.  It has the signature `function(err, results)`.  The results object is an Array containing information about each matching file.  

Each array element is an object with fields

* __error__ non-null if an error occurred on the file
* __basedir__ the directory within which the file was found
* __path__ the pathname of the file within `basedir`
* __fullpath__ the result of `path.join(basedir, path)`
* __result__ the `result` object provided by the `operate` callback above

For example: 

    globfs.operate([ 'dir', 'dir2', 'dir3' ], [ '**/*.md', '**/*.js' ],
		function(basedir, fpath, fini) { fini(null, fpath); },
		function(err, results) {
			util.log(util.inspect(results));
		});

collects all files with extension `.md` or `.js` within the basedirs.

    globfs.copy(basedirs, patterns, destdir, options, done)

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

Copies ALL files into the directory named `n2all`.  The first pattern tries to match every file, but the next two patterns are required to match files or directories whose name begins with `"."`.

    globfs.rm(basedirs, patterns, options, done)

Deletes files from the `basedirs` directories (as above) matching one of the `patterns` (as above).

The `options` argument is currently ignored but is meant to be an object tailoring the behavior.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err)`.

    globfs.rm('n2all', '**/*.js',
		function(err) {
			if (err) util.error(err);
			else util.log('done');
		});

Deletes just the files with the extension `.js` from the directory `n2all`.

    globfs.chmod(basedirs, patterns, newmode, options, done)
    globfs.chown(basedirs, patterns, uid, gid, options, done)

Changes file permissions or file ownership of files in the `basedirs` directories (as above) matching one of the `patterns` (as above).

The `options` argument is currently ignored but is meant to be an object tailoring the behavior.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err)`.

    globfs.chmod('n2all', '**/*.js', 0444,
		function(err) {
			if (err) util.error(err);
			else util.log('done');
		});

Changes permissions to read-only just for files with extension `.js` in the directory `n2all`.

    globfs.chown('n2all', '**/*.js', 666, 666,
		function(err) {
			if (err) util.error(err);
			else util.log('done');
		});

Changes the ownership of files with extension `.js` in the directory `n2all` to uid=666 and gid=666.


