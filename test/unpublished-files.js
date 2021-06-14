const test = require('ava');
const execa = require('execa');
const util = require('../../source/util');
const gitUtil = require('../../source/git-util');
const fs = require('fs');
const path = require('path');

test.before(async t => {
	await t.throwsAsync(gitUtil.latestTag(), null, 'prerequisites not met: repository should not contain any tags');
});

test.afterEach.always(async t => {
	if (typeof t.context.teardown === 'function') {
		await t.context.teardown();
	}
});

test.serial('files to package with tags added', async t => {
	await execa('git', ['tag', 'v0.0.0']);
	await execa('touch', ['new']);
	await execa('touch', ['index.js']);
	await execa('git', ['add', 'new', 'index.js']);
	await execa('git', ['commit', '-m', 'new files added']);

	t.context.teardown = async () => {
		await execa('git', ['rm', 'new']);
		await execa('git', ['rm', 'index.js']);
		await execa('git', ['tag', '-d', 'v0.0.0']);
		await execa('git', ['commit', '-m', 'new files deleted']);
	};

	t.deepEqual(await util.getNewFiles({files: ['*.js']}), {unpublished: ['new'], firstTime: ['index.js']});
});

test.serial('file `new` to package without tags added', async t => {
	await execa('touch', ['new']);
	await execa('touch', ['index.js']);

	t.context.teardown = () => {
		fs.unlinkSync('new');
		fs.unlinkSync('index.js');
	};

	t.deepEqual(await util.getNewFiles({files: ['index.js']}), {unpublished: ['new'], firstTime: ['index.js']});
});

test.serial('files with long pathnames added', async t => {
	const longPath = path.join('veryLonggggggDirectoryName', 'veryLonggggggDirectoryName');
	await execa('git', ['tag', 'v0.0.0']);
	await execa('mkdir', ['-p', longPath]);
	await execa('touch', [path.join(longPath, 'file1')]);
	await execa('touch', [path.join(longPath, 'file2')]);
	await execa('git', ['add', '.']);
	await execa('git', ['commit', '-m', 'new files added']);

	t.context.teardown = async () => {
		await execa('git', ['rm', '-r', longPath]);
		await execa('git', ['tag', '-d', 'v0.0.0']);
		await execa('git', ['commit', '-m', 'new files deleted']);
	};

	t.deepEqual(await util.getNewFiles({files: ['*.js']}), {unpublished: [path.join(longPath, 'file1'), path.join(longPath, 'file2')], firstTime: []});
});

test.serial('no new files added', async t => {
	await execa('git', ['tag', 'v0.0.0']);

	t.context.teardown = async () => {
		await execa('git', ['tag', '-d', 'v0.0.0']);
	};

	t.deepEqual(await util.getNewFiles({files: ['*.js']}), {unpublished: [], firstTime: []});
});
