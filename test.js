var globfs = require('./index');
var util   = require('util');

if (false) {
globfs.chown('n2all', '**/*.js', 666, 666,
	function(err) {
		if (err) util.error(err);
		else util.log('done');
	});
}

if (false) {
globfs.chmod('n2all', '**/*.js', 0444,
	function(err) {
		if (err) util.error(err);
		else util.log('done');
	});
}

if (false) {
globfs.rm('n2all', '**/*.js',
	function(err) {
		if (err) util.error(err);
		else util.log('done');
	});
}

if (false) {
globfs.copy('node_modules', [ '**/*', '**/.*/*', '**/.*' ], 'n2all',
	function(err) {
		if (err) util.error(err);
		else util.log('done');
	});
}

if (false) {
globfs.copy('node_modules', [ '**/*.md', '**/*.js' ], 'n2',
	function(err) {
		if (err) util.error(err);
		else util.log('done');
	});
}

if (false) {
globfs.operate('node_modules', '**/*.md',
	function(basedir, fpath, fini) {
		// util.log(basedir +' '+ fpath);
		fini(null, fpath);
	},
	function(err, results) {
		util.log(util.inspect(results));
	});
}
