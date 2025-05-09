// file: ./tests/phase-execution/lint-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {RuntimeParams, Unit_TypescriptLib} from '../../_common';
import {resolve} from 'path';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';
import {execSync} from 'node:child_process';

const libName = 'lib-lint';
const pathToWorkspace = resolve(__dirname, './temp/workspace');
const pathToPackages = resolve(pathToWorkspace, './temp/workspace/packages');
const unitPath = resolve(pathToPackages, libName);

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
		setupWorkspace(resolve(__dirname, fixture), unit.config.fullPath);
	}

	await unit.lint();
};

type TestSuite_LintPhase = TestSuite<Input, Output>;
type TestCase_LintPhase = TestSuite_LintPhase['testcases'][number];
const runTestCase = (testCase: TestCase_LintPhase) => () => runSingleTestCase(test, testCase);

describe('TypescriptLib - Lint Phase', () => {
	before(() => {
		setupWorkspace(resolve(__dirname, './fixtures.txt'), resolve(__dirname, 'temp'));
		try {
			const output = execSync('pnpm install', {stdio: 'pipe', cwd: pathToWorkspace});
			console.log(output.toString());
		} catch (error: any) {
			console.error('Command failed:', error.message);
			console.error('stdout:', error.stdout?.toString());
			console.error('stderr:', error.stderr?.toString());
			throw error;
		}
		RuntimeParams.lint = true;
	});

	it('Should pass linting without errors', runTestCase({
		input: {fixtures: ['./fixtures/workspace-lint-valid-lib.txt']},
		result: async () => {
			expect(true).to.be.true; // Placeholder until lint result is assertable
		}
	}));

	after(async () => {
		// execSync('npm uninstall -g eslint', {stdio: 'inherit'});
		// RuntimeParams.lint = false;
		// await FileSystemUtils.folder.delete(resolve(__dirname, './fixtures'));
		// await FileSystemUtils.folder.delete(pathToWorkspace);
	});
});
