# globfs
Useful functions for dealing with files, selecting them by "glob" patterns.

This Node.js module is an addon to the 'fs' module allowing the programmer to select files using glob patterns, acting on those files.

# Installation

```
npm install --save globfs
```

This gives you both a command-line tool, documented below, and a Node.js API, documented here: http://robogeek.github.io/globfs/

Installed as shown above, npm installs the command as `./node_modules/.bin/globfs`.  For convenience you should add the path `node_modules/.bin` to your PATH so that commands associated with Node.js modules are easily executed.

* Bash: in `$HOME/.profile` add this line: `export PATH="./node_modules/.bin:${PATH}`
* csh: in `$HOME/.cshrc` add this line: `setenv PATH ./node_modules/.bin:$PATH`
* Windows: TBD

The `globfs` command is invoked this way:

```
$ globfs --help

  Usage: globfs [options] [command]


  Commands:

    find <srcdir> [patterns...]                      Find files based on the pattern(s)
    copy [options] <srcdir> <destdir> [patterns...]  Copy stuff from one directory to another
    rm [options] <dir> [patterns...]                 Delete stuff in a directory
    chmod [options] <dir> <newmode> [patterns...]    Change permissions of stuff in a directory
    chown [options] <dir> <uid> <gid> [patterns..]   Change ownership of stuff in a directory
    du [options] <dir> [patterns..]                  Disk utilization of stuff in a directory

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

For each of the commands you can run `globfs commandName --help` to get help for that command.

The commands should be self-explanatory, but here's a few examples

```
$ globfs find node_modules/ '**/*.css'
[ { basedir: 'node_modules/',
    path: 'akashacms-embeddables/assets/vendor/Viewer.js/example.local.css',
    fullpath: 'node_modules/akashacms-embeddables/assets/vendor/Viewer.js/example.local.css',
    result: 'akashacms-embeddables/assets/vendor/Viewer.js/example.local.css' },
  { basedir: 'node_modules/',
    path: 'akashacms-theme-bootstrap/bootstrap/bootstrap3/css/bootstrap-theme.css',
    fullpath: 'node_modules/akashacms-theme-bootstrap/bootstrap/bootstrap3/css/bootstrap-theme.css',
    result: 'akashacms-theme-bootstrap/bootstrap/bootstrap3/css/bootstrap-theme.css' },
  { basedir: 'node_modules/',
    path: 'akashacms-theme-bootstrap/bootstrap/bootstrap3/css/bootstrap-theme.min.css',
    fullpath: 'node_modules/akashacms-theme-bootstrap/bootstrap/bootstrap3/css/bootstrap-theme.min.css',
    result: 'akashacms-theme-bootstrap/bootstrap/bootstrap3/css/bootstrap-theme.min.css' },
  ... ]
```

The `find` command is useful for finding files.

```
$ globfs copy node_modules node_modules_css '**/*.css'

$ du -sk node_modules node_modules_css
44364   node_modules
1068    node_modules_css
```

You can copy selected files from a directory hierarchy, preserving the hierarchy.  In this case we selected just the CSS files, proved by the disk consumption of the resulting directory tree.

```
$ globfs copy node_modules node_modules_cssjs '**/*.css' '**/*.js'

$ du -sk node_modules node_modules_css node_modules_cssjs
44364   node_modules
1068    node_modules_css
30044   node_modules_cssjs
```

We can add a second file pattern to copy the JavaScript files, and see that the second directory tree, containing both CSS and JS files, is much bigger.

```
$ globfs rm node_modules_cssjs '**/*.js'

$ du -sk node_modules node_modules_css node_modules_cssjs
44364   node_modules
1068    node_modules_css
1064    node_modules_cssjs
```

The `rm` command deletes selected files.  Deleting the JavaScript files from the previously created directory brings it close in size to the CSS-only directory tree.

```
$ globfs rm node_modules_cssjs

$ du -sk node_modules node_modules_css node_modules_cssjs
44368   node_modules
1068    node_modules_css
0       node_modules_cssjs
```

For all the commands, specifying zero glob patterns means the operation works on every file in the hierarchy.  In this case we deleted everything under the directory, leaving it consuming 0 bytes.

```
$ globfs du node_modules '**/*.css'
782248
$ globfs du node_modules_css '**/*.css'
782248
```

Remember that the second directory was created by copying all CSS files from the first.  It stands to reason, then, that these two commands tells us an identical figure for disk consumption.
