import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {FileSystemUtils, Unit_PackageJson, Unit_TypescriptLib} from '../../_common.js';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {___dirname} from '@nu-art/ts-common/esm';

const dirname = ___dirname(import.meta.url);

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);
let buildAndInstall: BuildAndInstall;

type Input = {
	fixtures: string[]
	unitKey: string
};
type Output = () => void;

let unit: Unit_PackageJson;
const test = async (setup: Input): Promise<void> => {
	// workspaceCreator.setupWorkspace(setup.fixtures, '', false);

	unit = buildAndInstall.projectUnits.find(unit => unit.config.key == setup.unitKey) as Unit_PackageJson;
	await unit.purge();
};

type TestSuite_UnitPurge = TestSuite<Input, Output>;
type TestCase_UnitPurge = TestSuite_UnitPurge['testcases'][number];
const runTestCase = (testCase: TestCase_UnitPurge) => () => runSingleTestCase(test, testCase);

describe('Unit - Purge Phase', () => {
	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
		workspaceCreator.setupWorkspace(['workspace.txt']);
		workspaceCreator.setupWorkspace(['lib-purge.txt'], 'lib-purge');

		buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
		await buildAndInstall.build();
		await buildAndInstall.nodeProjectUnit?.install();
	});


	it('TypescriptLib - purge node_modules and dist', runTestCase(() => {
		return {
			input: {
				fixtures: [/*'./workspace-purge-node-lib.txt'*/],
				unitKey: 'lib-purge',
			},
			result: async () => {
				expect(existsSync(resolve(unit.config.fullPath, 'node_modules'))).to.be.false;
				expect(existsSync(resolve(unit.config.fullPath, (unit as Unit_TypescriptLib).config.output))).to.be.false;
			}
		};
	}));

	it('Project Unit - purge node_modules and and lock files', runTestCase(() => {
		return {
			input: {
				fixtures: [/*'./workspace-purge-root-project.txt'*/],
				unitKey: 'project-root',
			},
			result: async () => {
				expect(existsSync(resolve(unit.config.fullPath, 'node_modules'))).to.be.false;
				expect(existsSync(resolve(unit.config.fullPath, 'pnpm-lock.yaml'))).to.be.false;
				expect(existsSync(resolve(unit.config.fullPath, 'pnpm-workspace.yaml'))).to.be.false;
				expect(existsSync(resolve(unit.config.fullPath, 'package-lock.json'))).to.be.false;
			}
		};
	}));

	after(async function () {
		const allPassed = this.test?.parent?.tests.every(t => t.state === 'passed');
		if (allPassed)
			await FileSystemUtils.folder.delete(pathToTemp);

		await CommandoPool.killAll();
	});
});
