import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_Install, phase_Prepare, Unit_PackageJson, Unit_TypescriptLib} from '../../_common.js';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {___dirname} from '@nu-art/ts-common/esm';
import {sleep} from '@nu-art/ts-common';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';

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
	// await workspaceCreator.setupWorkspace(setup.fixtures, '', false);

	unit = buildAndInstall.projectUnits.find(unit => unit.config.key == setup.unitKey) as Unit_PackageJson;
	await unit.purge();
};

type TestSuite_UnitPurge = TestSuite<Input, Output>;
type TestCase_UnitPurge = TestSuite_UnitPurge['testcases'][number];
const runTestCase = (testCase: TestCase_UnitPurge) => () => runSingleTestCase(test, testCase);

describe('Unit - Purge Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
		await workspaceCreator.setupWorkspace(['workspace.txt']);
		await workspaceCreator.setupWorkspace(['lib-purge.txt'], 'lib-purge');

		buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
		buildAndInstall.runtimeParams.allUnits = true;

		await buildAndInstall.build();
		buildAndInstall.setPhases([[phase_Prepare], [phase_Install]]);
		await buildAndInstall.run();
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
