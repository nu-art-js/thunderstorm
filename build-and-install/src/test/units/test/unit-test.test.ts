// file: ./tests/phase-execution/test-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {phase_Install, phase_Prepare, Unit_TypescriptLib} from '../../_common.js';
import {resolve} from 'path';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {___dirname} from '@nu-art/ts-common/esm';
import {sleep} from '@nu-art/ts-common';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';

const dirname = ___dirname(import.meta.url);

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

type Input = { fixtures: string[] };
type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	const buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
	await buildAndInstall.build();

	await workspaceCreator.setupWorkspace(setup.fixtures, 'lib-test', false);
	const unit = buildAndInstall.projectUnits.find(unit => unit.config.key == '@demo/lib-test') as Unit_TypescriptLib;
	await unit.runTests();
};

type TestSuite_TestPhase = TestSuite<Input, Output>;
type TestCase_TestPhase = TestSuite_TestPhase['testcases'][number];
const runTestCase = (testCase: TestCase_TestPhase) => () => runSingleTestCase(test, testCase);

describe('TypescriptLib - Test Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
		await workspaceCreator.setupWorkspace(['workspace.txt']);
		await workspaceCreator.setupWorkspace(['project-lib-test.txt'], 'lib-test');

		const buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
		await buildAndInstall.build();
		buildAndInstall.setPhases([[phase_Prepare], [phase_Install]]);
		await buildAndInstall.run();
	});

	it('Should pass generated test suite', runTestCase({
		input: {fixtures: ['./workspace-test-pass.txt']},
		result: async () => {
			expect(true).to.be.true;
		}
	})).timeout(15000);

	it('Should fail generated test suite', runTestCase({
		input: {fixtures: ['./workspace-test-fail.txt']},
		error: {
			expected: 'Error running tests'
		}
	})).timeout(15000);

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
