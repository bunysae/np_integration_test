const test = require('ava');
const execa = require('execa');
const util = require('../../source/util.js');
const gitUtil = require('../../source/git-util.js');
const fs = require('fs');

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
