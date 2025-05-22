// file: ./tests/phase-execution/install-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {FileSystemUtils} from '../../../main/v3/core/FileSystemUtils';
import {execSync} from 'node:child_process';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3';
import {FilesCache} from '../../../main/v3/core/FilesCache';
import {CONST_NodeModules} from '../../../main/core/consts';

const pathToTemp = resolve(__dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(__dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

const pathToProject = pathToWorkspace; // alias for clarity

type Input = { fixtures: string[] };
type Output = () => void;

const runInstallTest = async (setup: Input): Promise<void> => {
	FilesCache.clear();
	workspaceCreator.setupWorkspace(setup.fixtures);

	const buildAndInstall = new BuildAndInstall(pathToWorkspace);
	await buildAndInstall.build();
	const unit = buildAndInstall.nodeProjectUnit;
	await unit?.install();
};

const runTestCase = (test: (input: Input) => Promise<void>) => (testCase: TestSuite<Input, Output>['testcases'][number]) =>
	() => runSingleTestCase(test, testCase);

describe('NodeProject - Install Phase (Project Packages)', () => {
	const run = runTestCase(runInstallTest);

	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
	});

	it('Should installPackages', run(() => ({
		input: {fixtures: ['workspace.txt']},
		result: async () => {
			assertLocalPackageInstalled();
		}
	}))).timeout(10000);

	it('Should link a local typescript library into root node_modules', run(() => ({
		input: {fixtures: ['workspace.txt', './project-root--with-linked-package.txt']},
		result: async () => {
			const linkedPath = resolve(pathToProject, `${CONST_NodeModules}/lib-linked`);
			expect(existsSync(linkedPath)).to.be.true;

			const realPath = resolve(pathToWorkspace, CONST_NodeModules, await FileSystemUtils.symlink.read(linkedPath));
			const expextedPath = resolve(pathToWorkspace, 'lib-linked/dist');
			expect(realPath).to.equal(expextedPath);
		}
	}))).timeout(10000);
});

describe('NodeProject - Install Phase (Global Packages)', () => {
	const run = runTestCase(runInstallTest);

	it('Should installGlobals', run(() => {
		uninstallGlobalPackage();
		return {
			input: {fixtures: ['./workspace-install-root-project.txt']},
			result: async () => {
				assertGlobalPackageInstalled();
			}
		};
	})).timeout(15000);

	it('Should not installGlobals when skipped', run(() => {
		uninstallGlobalPackage();
		return {
			input: {fixtures: ['./workspace-install-root-project.txt']},
			result: async () => {
				assertGlobalPackageInstalled(false);
			}
		};
	})).timeout(10000);
});

after(async function () {
	const allPassed = this.test?.parent?.tests.every(t => t.state === 'passed');
	if (allPassed)
		await FileSystemUtils.folder.delete(pathToTemp);

	await CommandoPool.killAll();
});

function assertGlobalPackageInstalled(exists = true) {
	const globalList = execSync('npm list -g --depth=0', {encoding: 'utf8'});
	if (exists)
		expect(globalList).to.include('is-sorted');
	else
		expect(globalList).to.not.include('is-sorted');
}

function uninstallGlobalPackage() {
	execSync('npm uninstall -g is-sorted');
}

function assertLocalPackageInstalled() {
	expect(existsSync(resolve(pathToProject, CONST_NodeModules))).to.be.true;
	expect(existsSync(resolve(pathToProject, `${CONST_NodeModules}/typescript`))).to.be.true;
}