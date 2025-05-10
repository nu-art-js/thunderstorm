// file: ./tests/phase-execution/compile-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {Unit_TypescriptLib} from '../../_common';
import {resolve} from 'path';
import {existsSync, readFileSync} from 'fs';
import {expect} from 'chai';
import {DebugFlag, LogLevel} from '@nu-art/ts-common';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';

DebugFlag.DefaultLogLevel = LogLevel.Verbose;
const libName = 'lib-compile';
const pathToTemp = resolve(__dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');

const libCompile = mapLibFileSystem(libName);

const packageJsonDist = {name: libName, version: '1.0.0'};

function mapLibFileSystem(libName: string) {
	const path = resolve(pathToWorkspace, libName);
	const srcMain = resolve(path, 'src/main');
	const srcTest = resolve(path, 'src/test');

	return {
		name: libName,
		path,
		eslint: resolve(path, '.eslintrc.json'),
		main: {
			path: srcMain,
			tsconfig: resolve(srcMain, 'tsconfig.json'),
		},
		test: {
			path: srcTest,
			tsconfig: resolve(srcTest, 'tsconfig.json'),
		},
	};
}

function readDistPackageJSON(): any {
	const path = resolve(libCompile.path, 'dist/package.json');
	return JSON.parse(readFileSync(path, 'utf-8'));
}

type Input = {
	fixtures: string[];
	compileWatch?: boolean;
};
type Output = () => (Promise<void>);

const test = async (setup: Input): Promise<void> => {
	for (const fixture of setup.fixtures) {
		setupWorkspace(resolve(pathToFixtures, fixture), pathToWorkspace);
	}

	const unit = new Unit_TypescriptLib({
		key: libCompile.name,
		label: libCompile.name,
		relativePath: `./${libCompile.name}`,
		fullPath: libCompile.path,
		output: resolve(libCompile.path, 'dist'),
		dependencies: {},
		customTSConfig: true,
		customESLintConfig: true,
	});

	unit.setMinLevel(LogLevel.Verbose);
	(unit as any).packageJson = {dist: packageJsonDist};

	if (setup.compileWatch)
		await unit.watchCompile();
	else
		await unit.compile();
};

type TestSuite_PhaseCompile = TestSuite<Input, Output>;
type TestCase_PhaseCompile = TestSuite_PhaseCompile['testcases'][number];

const runTestCase = (testCase: TestCase_PhaseCompile, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Unit_NodeLib - Compile Phase', () => {
	before(() => {
		setupWorkspace(resolve(__dirname, './fixtures.txt'), resolve(pathToTemp, './fixtures'));
	});

	it('Compile - Creates output folder if it does not exist', runTestCase({
		input: {fixtures: ['./workspace-compile-valid.txt']},
		result: async () => {
			expect(existsSync(resolve(libCompile.path, 'dist'))).to.be.true;
		}
	}));

	it('Compile - Valid tsconfig and outputs JS to dist', runTestCase({
		input: {fixtures: ['./workspace-compile-valid.txt']},
		result: async () => {
			const compiledJS = resolve(libCompile.path, 'dist/index.js');
			expect(existsSync(compiledJS)).to.be.true;
		}
	}));

	it('Compile - Copies assets (e.g. .svg) to dist folder', runTestCase({
		input: {fixtures: ['./workspace-compile-with-asset.txt']},
		result: async () => {
			expect(existsSync(resolve(libCompile.path, 'dist/file.svg'))).to.be.true;
		}
	}));

	it('Compile - Writes dist/package.json with correct content', runTestCase({
		input: {fixtures: ['./workspace-compile-valid.txt']},
		result: async () => {
			const pkg = readDistPackageJSON();
			expect(pkg.name).to.equal(packageJsonDist.name);
			expect(pkg.version).to.equal(packageJsonDist.version);
		}
	}));

	it('Compile - Fails with invalid tsconfig file', runTestCase({
		input: {fixtures: ['./workspace-compile-invalid-tsconfig.txt']},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Compile - Fails gracefully with missing tsconfig.json', runTestCase({
		input: {fixtures: ['./workspace-compile-missing-tsconfig.txt']},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Compile - Fails on syntax error in source', runTestCase({
		input: {fixtures: ['./workspace-compile-invalid-source.txt']},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Watch Compile - Fails on syntax error in source using watchCompile()', runTestCase({
		input: {fixtures: ['./workspace-compile-invalid-source.txt'], compileWatch: true},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Watch Compile - Outputs JS to dist', runTestCase({
		input: {fixtures: ['./workspace-compile-valid.txt'], compileWatch: true},
		result: async () => {
			const compiledJS = resolve(libCompile.path, 'dist/index.js');
			expect(existsSync(compiledJS)).to.be.true;
		}
	}));

	it('Watch Compile - Fails with invalid tsconfig', runTestCase({
		input: {fixtures: ['./workspace-compile-invalid-tsconfig.txt'], compileWatch: true},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Watch Compile - Copies assets (e.g. .svg) to dist folder', runTestCase({
		input: {fixtures: ['./workspace-compile-with-asset.txt'], compileWatch: true},
		result: async () => {
			expect(existsSync(resolve(libCompile.path, 'dist/file.svg'))).to.be.true;
		}
	}));


	after(async () => {
		await CommandoPool.killAll();
	});
});
