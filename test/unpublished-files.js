const test = require('ava');
const execa = require('execa');
const util = require('../../source/util.js');
const gitUtil = require('../../source/git-util.js');
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

test.serial('file `new` to package with tags added', async t => {
	await execa('git', ['tag', 'v0.0.0']);
	await execa('touch', ['new']);
	await execa('git', ['add', 'new']);
	await execa('git', ['commit', '-m', 'new file added']);

	t.context.teardown = async () => {
		await execa('git', ['rm', 'new']);
		await execa('git', ['tag', '-d', 'v0.0.0']);
		await execa('git', ['commit', '-m', 'new file deleted']);
	};

	t.deepEqual(await util.getNewAndUnpublishedFiles({files: ['*.js']}), ['new']);
});

test.serial('file `new` to package without tags added', async t => {
	await execa('touch', ['new']);

	t.context.teardown = () => {
		fs.unlinkSync('new');
	};

	t.deepEqual(await util.getNewAndUnpublishedFiles({files: ['*.js']}), ['new']);
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

	t.deepEqual(await util.getNewAndUnpublishedFiles({files: ['*.js']}), [path.join(longPath, 'file1'), path.join(longPath, 'file2')]);
});

test.serial('no new files added', async t => {
	await execa('git', ['tag', 'v0.0.0']);

	t.context.teardown = async () => {
		await execa('git', ['tag', '-d', 'v0.0.0']);
	};

	t.deepEqual(await util.getNewAndUnpublishedFiles({files: ['*.js']}), []);
});
