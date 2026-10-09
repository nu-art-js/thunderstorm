import {expect} from 'chai';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';
import {preparePackageJsonForPublish, stripPublishConfig} from '../../../main/units/implementations/publish-package-json.js';

describe('publish - package.json without publishConfig', () => {
	let dir: string;
	const pkgPath = () => join(dir, 'package.json');
	const read = () => JSON.parse(readFileSync(pkgPath(), 'utf8'));

	beforeEach(() => dir = mkdtempSync(join(tmpdir(), 'bai-publish-')));
	afterEach(() => rmSync(dir, {recursive: true, force: true}));

	it('stripPublishConfig drops publishConfig and keeps everything else', () => {
		const pkg = {name: '@nu-art/x', version: '1.0.0', publishConfig: {directory: 'dist', linkDirectory: true}, unitConfig: {output: 'dist'}};
		expect(stripPublishConfig(pkg)).to.deep.equal({name: '@nu-art/x', version: '1.0.0', unitConfig: {output: 'dist'}});
		expect(pkg.publishConfig).to.deep.equal({directory: 'dist', linkDirectory: true});
	});

	it('rewrites the output package.json without publishConfig', async () => {
		writeFileSync(pkgPath(), JSON.stringify({name: '@nu-art/x', publishConfig: {directory: 'dist', linkDirectory: true}, exports: {'.': './index.js'}}));
		await preparePackageJsonForPublish(dir);
		expect(read()).to.deep.equal({name: '@nu-art/x', exports: {'.': './index.js'}});
	});

	it('leaves a package.json without publishConfig untouched', async () => {
		const original = '{"name":"@nu-art/x"}';
		writeFileSync(pkgPath(), original);
		await preparePackageJsonForPublish(dir);
		expect(readFileSync(pkgPath(), 'utf8')).to.equal(original);
	});
});
