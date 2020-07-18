const test = require('ava');
const execa = require('execa');
const util = require('../../source/util.js');
const gitUtil = require('../../source/git-util.js');
const fs = require('fs');

test.before(async t => {
	await t.throwsAsync(gitUtil.latestTag(), null, 'prerequisites not met: repository should not contain any tags');
});

test.before(async () => {
	await execa('touch', ['new']);	
});

test.after.always(() => {
	fs.unlinkSync('new');
});

test('newly created file `new` is a unpublished file', async t => {
	t.deepEqual(await util.getNewAndUnpublishedFiles({files: ['*.js']}), ['new']);
});
