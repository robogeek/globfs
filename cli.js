#!/usr/bin/env node


/**
 * cli
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

const program   = require('commander');
const globfs    = require('./index');

process.title = 'globfs';
program.version('0.2.0');

/* eslint-disable no-console */

program
    .command('find <srcdir> [patterns...]')
    .description('Find files based on the pattern(s)')
    .action(async (srcdir, patterns) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        console.log(await globfs.findAsync(srcdir, patterns));
    });

program
    .command('copy <srcdir> <destdir> [patterns...]')
    .option('-v, --verbose', 'Verbose output')
    .description('Copy stuff from one directory to another')
    .action(async (srcdir, destdir, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        console.log(await globfs.copyAsync(srcdir, patterns, destdir, options));
    });

program
    .command('rm <dir> [patterns...]')
    .option('-v, --verbose', 'Verbose output')
    .description('Delete stuff in a directory')
    .action(async (dir, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        console.log(await globfs.rmAsync(dir, patterns, options));
    });

program
    .command('chmod <dir> <newmode> [patterns...]')
    .option('-v, --verbose', 'Verbose output')
    .description('Change permissions of stuff in a directory')
    .action(async (dir, newmode, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        console.log(await globfs.chmodAsync(dir, patterns, newmode, options));
    });

program
    .command('chown <dir> <uid> <gid> [patterns..]')
    .option('-v, --verbose', 'Verbose output')
    .description('Change ownership of stuff in a directory')
    .action(async (dir, uid, gid, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        console.log(await globfs.chownAsync(dir, patterns, uid, gid, options));
    });

program
    .command('du <dir> [patterns..]')
    .option('-v, --verbose', 'Verbose output')
    .description('Disk utilization of stuff in a directory')
    .action(async (dir, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        console.log(await globfs.duAsync(dir, patterns, options));
    });

program.parse(process.argv);
