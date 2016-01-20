#!/usr/bin/env node


/**
 * cli
 *
 * Copyright 2015 David Herron
 *
 * This file is part of epubtools (http://akashacms.com/).
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

var program   = require('commander');
var globfs    = require('./index');
var util      = require('util');

'use strict';

process.title = 'globfs';
program.version('0.1.2');


program
    .command('copy <srcdir> <destdir> [patterns...]')
    .description('Copy stuff from one directory to another')
    .action((srcdir, destdir, patterns) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.copy(srcdir, patterns, destdir, {},
        err => {
            if (err) { console.error(err.stack); }
        });
    });

program
    .command('rm <dir> [patterns...]')
    .description('Delete stuff in a directory')
    .action((dir, patterns) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.rm(dir, patterns, {},
        err => {
            if (err) { console.error(err.stack); }
        });
    });

program
    .command('chmod <dir> <newmode> [patterns...]')
    .description('Change permissions of stuff in a directory')
    .action((dir, newmode, patterns) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.chmod(dir, newmode, patterns, {},
        err => {
            if (err) { console.error(err.stack); }
        });
    });

program
    .command('chown <dir> <uid> <gid> [patterns..]')
    .description('Change ownership of stuff in a directory')
    .action((dir, uid, gid, patterns) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.chown(dir, uid, gid, patterns, {},
        err => {
            if (err) { console.error(err.stack); }
        });
    });


program.parse(process.argv);

