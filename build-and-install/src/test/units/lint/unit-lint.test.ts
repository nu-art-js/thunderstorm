// file: ./tests/phase-execution/lint-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {RuntimeParams, Unit_TypescriptLib} from '../../_common';
import {resolve} from 'path';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';
import {execSync} from 'node:child_process';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';

const libName = 'lib-lint';
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

// const pathToWorkspace = resolve(__dirname, './workspace');
type Input = { fixtures: string[] };
type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	const unit = createTestUnit_TypescriptLib();
	for (const fixture of setup.fixtures) {
		setupWorkspace(resolve(pathToFixtures, fixture), pathToWorkspace);
	}
	try {
		let output = execSync('pnpm install', {stdio: 'pipe', cwd: pathToWorkspace});
		console.log(output.toString());
		output = execSync('which pnpm', {stdio: 'pipe', cwd: pathToWorkspace});
		console.log(output.toString());
	} catch (error: any) {
		console.error('Command failed:', error.message);
		console.error('stdout:', error.stdout?.toString());
		console.error('stderr:', error.stderr?.toString());
		throw error;
	}

	console.log('BEFORE LINT');
	await unit.lint();
	console.log('AFTER LINT');
};

type TestSuite_LintPhase = TestSuite<Input, Output>;
type TestCase_LintPhase = TestSuite_LintPhase['testcases'][number];
const runTestCase = (testCase: TestCase_LintPhase) => () => runSingleTestCase(test, testCase);

describe('TypescriptLib - Lint Phase', () => {
	before(() => {
			setupWorkspace(resolve(__dirname, './fixtures.txt'), resolve(__dirname, 'temp'));
		}
	);


	it('Should pass linting without errors', runTestCase(() => {
		RuntimeParams.lint = true;
		return {
			input: {fixtures: ['./workspace-lint-valid-lib.txt']},
			result: async () => {
				expect(true).to.be.true; // Placeholder until lint result is assertable
			}
		};
	})).timeout(15000);

	it('Should fail linting on invalid code', runTestCase(() => {
		RuntimeParams.lint = true;
		return {
			input: {fixtures: ['./workspace-lint-invalid-lib.txt']},
			error: {
				expected: 'Linting failed'
			}
		};
	})).timeout(15000);

	after(async () => {
		RuntimeParams.lint = false;
		await CommandoPool.killAll();
	});
});
