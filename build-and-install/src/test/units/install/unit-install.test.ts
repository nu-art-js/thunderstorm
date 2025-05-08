// file: ./tests/phase-execution/install-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {Unit_NodeProject, Unit_TypescriptLib} from '../../_common';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';
import {RuntimeParams} from '../../../main/core/params/params';
import {FileSystemUtils} from '../../../main/v3/core/FileSystemUtils';
import {execSync} from 'node:child_process';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';

const projectName = 'workspace';
const pathToProject = resolve(__dirname, './workspace');

const createTestUnit_NodeProject = () => new Unit_NodeProject({
	key: projectName,
	label: projectName,
	relativePath: `.`,
	fullPath: pathToProject,
	dependencies: {},
	isRoot: true,
	globalPackages: {'is-sorted': '*'}
});

const createTestUnit_TypescriptLib = (name: string): Unit_TypescriptLib => new Unit_TypescriptLib({
	key: name,
	label: name,
	relativePath: `./packages/${name}`,
	fullPath: resolve(pathToProject, `packages/${name}`),
	output: resolve(pathToProject, `packages/${name}/dist`),
	dependencies: {},
	customTSConfig: true,
	customESLintConfig: true
});

type Input = { fixtures: string[], units?: Unit_TypescriptLib[] };
type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	const unit = createTestUnit_NodeProject();
	if (setup.units)
		unit.assignUnit(setup.units);

	for (const fixture of setup.fixtures) {
		setupWorkspace(resolve(__dirname, fixture), unit.config.fullPath);
	}

	await unit.install();
};

type TestSuite_InstallPhase = TestSuite<Input, Output>;
type TestCase_InstallPhase = TestSuite_InstallPhase['testcases'][number];
const runTestCase = (testCase: TestCase_InstallPhase) => () => runSingleTestCase(test, testCase);

describe('NodeProject - Install Phase', () => {
	before(() => {
		setupWorkspace(resolve(__dirname, './fixtures.txt'), resolve(__dirname, './fixtures'));
	});

	it('Should installPackages', runTestCase(() => {
		RuntimeParams.installGlobals = false;
		RuntimeParams.installPackages = true;

		return {
			input: {fixtures: ['./fixtures/workspace-install-root-project.txt']},
			result: async () => {
				assertLocalPackageInstalled();
			}
		};
	})).timeout(10000);

	it('Should installGlobals', runTestCase(() => {
		RuntimeParams.installGlobals = true;
		RuntimeParams.installPackages = false;
		uninstallGlobalPackage();

		return {
			input: {fixtures: ['./fixtures/workspace-install-root-project.txt']},
			result: async () => {
				assertGlobalPackageInstalled();
			}
		};
	})).timeout(15000);

	it('Should installGlobals and installPackages', runTestCase(() => {
		RuntimeParams.installGlobals = true;
		RuntimeParams.installPackages = true;
		uninstallGlobalPackage();

		return {
			input: {fixtures: ['./fixtures/workspace-install-root-project.txt']},
			result: async () => {
				assertLocalPackageInstalled();
				assertGlobalPackageInstalled();
			}
		};
	})).timeout(10000);

	it('Should not installGlobals and installPackages', runTestCase(() => {
		RuntimeParams.installGlobals = false;
		RuntimeParams.installPackages = false;
		uninstallGlobalPackage();

		return {
			input: {fixtures: ['./fixtures/workspace-install-root-project.txt']},
			result: async () => {
				expect(existsSync(resolve(pathToProject, 'node_modules'))).to.be.false;
				assertGlobalPackageInstalled(false);
			}
		};
	})).timeout(10000);

	it('Should link a local typescript library into root node_modules', runTestCase(() => {
		RuntimeParams.installGlobals = false;
		RuntimeParams.installPackages = true;

		return {
			input: {
				fixtures: ['./fixtures/workspace-install-linked-package.txt'],
				units: [createTestUnit_TypescriptLib('lib-linked')]
			},
			result: async () => {
				const linkedPath = resolve(pathToProject, 'node_modules/lib-linked');
				expect(existsSync(linkedPath)).to.be.true;

				const realPath = await FileSystemUtils.symlink.read(linkedPath);
				expect(realPath.endsWith('../packages/lib-linked/dist')).to.be.true;
			}
		};
	})).timeout(10000);

	after(async () => {
		RuntimeParams.installGlobals = false;
		RuntimeParams.installPackages = false;
		await FileSystemUtils.folder.delete(resolve(__dirname, './fixtures'));
		await FileSystemUtils.folder.delete(resolve(__dirname, './workspace'));
		await CommandoPool.killAll();
	});
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
	expect(existsSync(resolve(pathToProject, 'node_modules'))).to.be.true;
	expect(existsSync(resolve(pathToProject, 'node_modules/is-sorted'))).to.be.true;
}
