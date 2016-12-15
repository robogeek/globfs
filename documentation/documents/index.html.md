---
layout: default.html.ejs
title: Globfs API documentation
---

INSTALLATION: `npm install globfs --save`

What follows is API documentation.  For the command-line documentation, see: https://github.com/robogeek/globfs

In your application, put this at the top

```
const globfs = require('globfs');
```

This brings in the module.  For every function we have a pair of implementations, offering both the traditional callback API, and an _Async_ version returning a Promise.

```
globfs.operateAsync(basedirs, patterns, operation)
globfs.operate(basedirs, patterns, operation, done)
```

This is a base method from which one can implement many other methods.  It also introduced a couple concepts used in the rest of the methods.

The `basedirs` argument is a list of directories to search.  This can either be a String, or an Array of String's.

The `patterns` argument is a list of glob patterns with which to search.  This can either be a String, or an Array of String's.

The `operation` argument is a callback function provided by the caller with the signature `function(basedir, fpath, fini)` and is called on each file matched by the glob's.  The function is required to call the `fini` function with the signature `function(err, result)`.  

The `fini` function indicates one of two things :-

* Is there an error with that file
* Allows the caller to process the file and supply some data

If you do not supply an `operation`, one is substituted that causes all files found by the pattern to be added to the results list.

The `operate` function collects all `result` objects, supplying them through the `done` method.  If the called function does not supply a `result` object, then the file is eliminated from the results array.  Hence, this is the minimal `fini` function:

```
globfs.operate(..., ..., (basedir, fpath, fini) => { fini(null, fpath); }, ...);
```

The `done` argument is a callback function provided by the caller which is called once `operate` is finished.  It has the signature `function(err, results)`.  The results object is an Array containing information about each matching file.  

The `operateAsync` method returns a Promise instead of calling `done`, of course.

Each array element is an object with fields

* __error__ non-null if an error occurred on the file
* __basedir__ the directory within which the file was found
* __path__ the pathname of the file within `basedir`
* __fullpath__ the result of `path.join(basedir, path)`
* __result__ the `result` object provided by the `operate` callback above

For example:

```
globfs.operate([ 'dir', 'dir2', 'dir3' ], [ '**/*.md', '**/*.js' ],
	(basedir, fpath, fini) => { fini(null, fpath); },
	(err, results) => {
		util.log(util.inspect(results));
	});
```

collects all files with extension `.md` or `.js` within the basedirs.

```
globfs.findAsync(basedirs, patterns)
globfs.find(basedirs, patterns, done)
globfs.findSync(basedirs, patterns)
```

Search in the `basedirs` directories for files matching `patterns`.

The `done` argument is a callback function provided by the caller which is called once all files have been found.  It has the signature `function(err, files)`.

The `findAsync` method of course returns a Promise rather than calling `done`.  And the `findSync` method uses synchronous `fs` functions.

```
globfs.copyAsync(basedirs, patterns, destdir, options)
globfs.copy(basedirs, patterns, destdir, options, done)
```

Copies files from the `basedirs` directories (as above) matching one of the `patterns` (as above) to `destdir`.

The `options` argument is currently ignored but is meant to be an object tailoring the behavior.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err)`.

The `copyAsync` method of course returns a Promise rather than calling `done`.

```
globfs.copy('node_modules', [ '**/*.md', '**/*.js' ], 'n2',
    (err) => {
        if (err) util.error(err);
        else util.log('done');
    });
```

Copies just files with extension `.md` or `.js` into the directory named `n2`.

```
globfs.copy('node_modules', [ '**/*', '**/.*/*', '**/.*' ], 'n2all',
    (err) => {
        if (err) util.error(err);
        else util.log('done');
    });

globfs.copyAsync('node_modules', [ '**/*', '**/.*/*', '**/.*' ], 'n2all')
.then(results => { console.log(results); })
.catch(err => { console.error(err.stack); });
```

Copies ALL files into the directory named `n2all`.  The first pattern tries to match every file, but the next two patterns are required to match files or directories whose name begins with `"."`.

```
globfs.rmAsync(basedirs, patterns, options)
globfs.rm(basedirs, patterns, options, done)
```

Deletes files from the `basedirs` directories (as above) matching one of the `patterns` (as above).

The `options` argument is currently ignored but is meant to be an object tailoring the behavior.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err)`.

The `rmAsync` method of course returns a Promise rather than calling `done`.

```
globfs.rm('n2all', '**/*.js',
    (err) => {
        if (err) util.error(err);
        else util.log('done');
    });

globfs.rmAsync('n2all', '**/*.js')
.then(results => { console.log(results); })
.catch(err => { console.error(err.stack); });
```

Deletes just the files with the extension `.js` from the directory `n2all`.

```
globfs.chmodAsync(basedirs, patterns, newmode, options)
globfs.chownAsync(basedirs, patterns, uid, gid, options)
globfs.chmod(basedirs, patterns, newmode, options, done)
globfs.chown(basedirs, patterns, uid, gid, options, done)
```

Changes file permissions or file ownership of files in the `basedirs` directories (as above) matching one of the `patterns` (as above).

The `options` argument is currently ignored but is meant to be an object tailoring the behavior.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err)`.

The `chmodAsync` and `chownAsync` methods of course returns a Promise rather than calling `done`.

```
globfs.chmod('n2all', '**/*.js', 0444,
    (err) => {
        if (err) util.error(err);
        else util.log('done');
    });

globfs.chmodAsync('n2all', '**/*.js', 0444)
.then(results => { console.log(results); })
.catch(err => { console.error(err.stack); });
```

Changes permissions to read-only just for files with extension `.js` in the directory `n2all`.

```
globfs.chown('n2all', '**/*.js', 666, 666,
    (err) => {
        if (err) util.error(err);
        else util.log('done');
    });


globfs.chownAsync('n2all', '**/*.js', 666, 666)
.then(results => { console.log(results); })
.catch(err => { console.error(err.stack); });
```

Changes the ownership of files with extension `.js` in the directory `n2all` to uid=666 and gid=666.

```
globfs.duAsync(basedirs, patterns, options)
globfs.du(basedirs, patterns, options, done)
```

Calculates disk utilization for the files matching `basedirs` and `patterns`.  The result provided is the total disk bytes consumed.

The `done` argument is a callback function provided by the caller which is called once all files have been copied.  It has the signature `function(err, results)`.  The `results` is simply a number giving disk usage for the files.

If `options.verbose` is truthy then the `results` instead is a text report listing each file, its size, and the total size.

```
globfs.du('n2all', '**/*.js',
    (err, results) => {
        if (err) util.error(err);
        else console.log(results);
    });

globfs.duAsync('n2all', '**/*.js')
.then(results => { console.log(results); })
.catch(err => { console.error(err.stack); });
```
