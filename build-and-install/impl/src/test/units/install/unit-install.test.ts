// file: ./tests/phase-execution/install-phase.test.ts

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {FilesCache} from '../../../main/core/FilesCache.js';
import {CONST_NodeModules} from '../../../main/config/consts.js';
import {phase_Install, phase_Prepare} from '../../../main/phases/definitions/consts.js';
import {___dirname} from '@nu-art/ts-common/esm';
import {sleep} from '@nu-art/ts-common';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';

const dirname = ___dirname(import.meta.url);

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

const pathToProject = pathToWorkspace; // alias for clarity

type Input = { fixtures: string[] };
type Output = () => Promise<void>;

const runInstallTest = async (setup: Input): Promise<void> => {
	FilesCache.clear();
	await workspaceCreator.setupWorkspace(setup.fixtures);

	const buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
	await buildAndInstall.build();
	buildAndInstall.setPhases([[phase_Prepare], [phase_Install]]);
	await buildAndInstall.run();
};

const runTestCase = (test: (input: Input) => Promise<void>) => (testCase: TestModel<Input, Output>) =>
	() => runSingleTestCase(test, testCase);

describe('NodeProject - Install Phase (Project Packages)', () => {
	const run = runTestCase(runInstallTest);
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
	});

	it('Should installPackages', run({
		input: {fixtures: ['workspace.txt', './project-root--with-linked-package.txt']},
		result: async () => {
			assertLocalPackageInstalled();
		}
	})).timeout(10000);

	it('Should link a local typescript library into root node_modules', run({
		input: {fixtures: ['workspace.txt', './project-root--with-linked-package.txt']},
		result: async () => {
			const linkedPath = resolve(pathToProject, `${CONST_NodeModules}/lib-linked`);
			expect(existsSync(linkedPath)).to.be.true;

			const realPath = resolve(pathToWorkspace, CONST_NodeModules, await FileSystemUtils.symlink.read(linkedPath));
			const expectedPath = resolve(pathToWorkspace, 'lib-linked/dist');
			expect(realPath).to.equal(expectedPath);
		}
	})).timeout(10000);

	afterEach(function () {
		if (this.currentTest?.state === 'failed')
			suiteHasFailures = true;

		suiteHasFailures ??= false;
	});

	after(async function () {
		await sleep(1000);
		if (suiteHasFailures === false)
			await FileSystemUtils.folder.delete(pathToTemp);

		await CommandoPool.killAll();
	});
});


function assertLocalPackageInstalled() {
	expect(existsSync(resolve(pathToProject, CONST_NodeModules))).to.be.true;
	expect(existsSync(resolve(pathToProject, `${CONST_NodeModules}/typescript`))).to.be.true;
}