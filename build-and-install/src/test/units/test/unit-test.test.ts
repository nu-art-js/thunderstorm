// file: ./tests/phase-execution/test-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {FileSystemUtils, ProjectUnit_RuntimeContext, RuntimeParams, Unit_TypescriptLib} from '../../_common';
import {resolve} from 'path';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {execSync} from 'node:child_process';

const libName = 'lib-test';
const pathToTemp = resolve(__dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const unitPath = resolve(pathToWorkspace, libName);

const createTestUnit_TypescriptLib = () => new Unit_TypescriptLib({
	key: libName,
	label: libName,
	relativePath: `./${libName}`,
	fullPath: unitPath,
	output: resolve(unitPath, 'dist'),
	dependencies: {},
	customTSConfig: true,
	customESLintConfig: true
});

type Input = { fixtures: string[] };
type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	const unit = createTestUnit_TypescriptLib();
	const runtimeContext = {parentUnit: {config: {fullPath: pathToWorkspace}}} as ProjectUnit_RuntimeContext;
	unit.setupRuntimeContext(runtimeContext);
	for (const fixture of setup.fixtures)
		setupWorkspace(resolve(pathToFixtures, fixture), pathToWorkspace);

	try {
		let output = execSync('pnpm install', {stdio: 'pipe', cwd: pathToWorkspace});
		console.log(output.toString());
	} catch (error: any) {
		console.error('Command failed:', error.message);
		console.error('stdout:', error.stdout?.toString());
		console.error('stderr:', error.stderr?.toString());
		throw error;
	}

	await unit.runTests();
};

type TestSuite_TestPhase = TestSuite<Input, Output>;
type TestCase_TestPhase = TestSuite_TestPhase['testcases'][number];
const runTestCase = (testCase: TestCase_TestPhase) => () => runSingleTestCase(test, testCase);

describe('TypescriptLib - Test Phase', () => {
	before(() => {
		setupWorkspace(resolve(__dirname, './fixtures.txt'), pathToTemp);
		RuntimeParams.test = true;
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

	after(async () => {
		RuntimeParams.test = false;
		await FileSystemUtils.folder.delete(pathToTemp);
		await CommandoPool.killAll();
	});
});
