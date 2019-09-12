

const globfs = require('../index');
const { assert } = require('chai');

describe('tests', function() {

    it('should copy *.js files successfully', async function() {
        this.timeout(15000);
        await globfs.copyAsync('../node_modules', '**/*.js', 'n2js');
    });

    it('should find *.js files in n2js', async function() {

        this.timeout(15000);
        let results = await globfs.operateAsync('n2js', '**/**');

        assert.exists(results);
        assert.isArray(results);

        for (let result of results) {
            assert.isObject(result);
            if (result.stats.isDirectory()) {
                continue;
            }
            assert.exists(result.path);
            assert.match(result.path, /\.js$/);
            assert.exists(result.fullpath);
            assert.match(result.fullpath, /\.js$/);
            assert.exists(result.result);
            assert.match(result.result, /\.js$/);
        }
        
    });
    
});

describe('delete', function() {

    it('should copy all files successfully', async function() {
        this.timeout(20000);
        await globfs.copyAsync('../node_modules', [ '**/*', '**/.*/*', '**/.*' ], 'n2all');
    });

    it('should remove *.js files successfully', async function() {
        this.timeout(18000);
        await globfs.rmAsync('n2all', '**/*.js');
    });

    it('should not find *.js files', async function() {
        this.timeout(15000);
        let results = await globfs.findAsync('n2all', '**/**');

        assert.exists(results);
        assert.isArray(results);

        for (let result of results) {
            assert.isObject(result);
            assert.exists(result.path);
            assert.notMatch(result.path, /\.js$/);
            assert.exists(result.fullpath);
            assert.notMatch(result.fullpath, /\.js$/);
            assert.exists(result.result);
            assert.notMatch(result.result, /\.js$/);
        }
    });

    it('should remove all n2all files successfully', async function() {
        this.timeout(18000);
        await globfs.rmAsync('n2all', [ '**/*', '**/.*/*', '**/.*' ]);
    });

    it('should not find regular files', async function() {
        this.timeout(15000);
        let results = await globfs.findAsync('n2all', [ '**/*', '**/.*/*', '**/.*' ]);

        assert.exists(results);
        assert.isArray(results);

        for (let result of results) {
            assert.isObject(result);
            assert.isTrue(result.stats.isDirectory());
        }
    });

});