#!/usr/bin/env node


/**
 * cli
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

var program   = require('commander');
var globfs    = require('./index');
var util      = require('util');

'use strict';

process.title = 'globfs';
program.version('0.2.0');


program
    .command('copy <srcdir> <destdir> [patterns...]')
    .option('-v, --verbose', 'Verbose output')
    .description('Copy stuff from one directory to another')
    .action((srcdir, destdir, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.copyAsync(srcdir, patterns, destdir, options)
        .then(results => { console.log(results); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('rm <dir> [patterns...]')
    .option('-v, --verbose', 'Verbose output')
    .description('Delete stuff in a directory')
    .action((dir, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.rmAsync(dir, patterns, options)
        .then(results => { console.log(results); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('chmod <dir> <newmode> [patterns...]')
    .option('-v, --verbose', 'Verbose output')
    .description('Change permissions of stuff in a directory')
    .action((dir, newmode, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.chmodAsync(dir, patterns, newmode, options)
        .then(results => { console.log(results); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('chown <dir> <uid> <gid> [patterns..]')
    .option('-v, --verbose', 'Verbose output')
    .description('Change ownership of stuff in a directory')
    .action((dir, uid, gid, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.chownAsync(dir, patterns, uid, gid, options)
        .then(results => { console.log(results); })
        .catch(err => { console.error(err.stack); });
    });

program
    .command('du <dir> [patterns..]')
    .option('-v, --verbose', 'Verbose output')
    .description('Disk utilization of stuff in a directory')
    .action((dir, patterns, options) => {
        if (!patterns || patterns.length <= 0) {
            patterns = [ '**/*' ];
        }
        globfs.duAsync(dir, patterns, options)
        .then(results => { console.log(results); })
        .catch(err => { console.error(err.stack); });
    });

program.parse(process.argv);
