// file: ./tests/phase-execution/compile-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {Unit_NodeLib} from '../../_common';
import {resolve} from 'path';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {expect} from 'chai';
import {DebugFlag, LogLevel} from '@nu-art/ts-common';

DebugFlag.DefaultLogLevel = LogLevel.Verbose;
const pathToPackages = resolve(__dirname, './workspace/packages');

const libCompile = mapLibFileSystem('lib-compile');

const packageJsonDist = {name: 'lib-compile', version: '1.0.0'};
const tsConfigContent = JSON.stringify({
	'compilerOptions': {
		'target': 'ES2020',
		'moduleResolution': 'node',
	}
}, null, 2);

function mapLibFileSystem(libName: string) {
	const path = resolve(pathToPackages, libName);
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

function ensureDir(path: string) {
	mkdirSync(path, {recursive: true});
}

function clean(path: string) {
	rmSync(path, {recursive: true, force: true});
}

function writeTSConfig(content: string = tsConfigContent) {
	writeFileSync(libCompile.main.tsconfig, content);
}

function writeDummyTSFile() {
	writeFileSync(resolve(libCompile.main.path, 'index.ts'), 'export const x = 5;');
}

function writeDummyAssetFile() {
	writeFileSync(resolve(libCompile.main.path, 'file.svg'), '<svg></svg>');
}

function readDistPackageJSON(): any {
	const path = resolve(libCompile.path, 'dist/package.json');
	return JSON.parse(readFileSync(path, 'utf-8'));
}

type Input = () => (Promise<void> | void);
type Output = () => (Promise<void>);

const test = async (setup: Input): Promise<void> => {
	setup();

	const unit = new Unit_NodeLib({
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

	await unit.compile();
};

type TestSuite_PhaseCompile = TestSuite<Input, Output>;
type TestCase_PhaseCompile = TestSuite_PhaseCompile['testcases'][number];


const runTestCase = (testCase: TestCase_PhaseCompile, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Unit_NodeLib - Compile Phase', () => {
	it('Compiles with valid tsconfig and outputs JS to dist', () => {
		return runTestCase({
			input: () => {
				clean(libCompile.main.path);
				ensureDir(libCompile.main.path);
				clean(libCompile.path + '/dist');
				writeTSConfig();
				writeDummyTSFile();
			},
			result: async () => {
				const compiledJS = resolve(libCompile.path, 'dist/index.js');
				expect(existsSync(compiledJS)).to.be.true;
			}
		});
	});

	it('Creates output folder if it does not exist', () => {
		return runTestCase({
			input: () => {
				clean(libCompile.main.path);
				ensureDir(libCompile.main.path);
				clean(libCompile.path + '/dist');
				writeTSConfig();
				writeDummyTSFile();
			},
			result: async () => {
				expect(existsSync(resolve(libCompile.path, 'dist'))).to.be.true;
			}
		});
	});

	it('Copies assets (e.g. .svg) to dist folder', () => {
		return runTestCase({
			input: () => {
				clean(libCompile.main.path);
				ensureDir(libCompile.main.path);
				clean(libCompile.path + '/dist');
				writeTSConfig();
				writeDummyTSFile();
				writeDummyAssetFile();
			},
			result: async () => {
				expect(existsSync(resolve(libCompile.path, 'dist/file.svg'))).to.be.true;
			}
		});
	});

	it('Writes dist/package.json with correct content', () => {
		return runTestCase({
			input: () => {
				clean(libCompile.main.path);
				ensureDir(libCompile.main.path);
				clean(libCompile.path + '/dist');
				writeTSConfig();
				writeDummyTSFile();
			},
			result: async () => {
				const pkg = readDistPackageJSON();
				expect(pkg.name).to.equal(packageJsonDist.name);
				expect(pkg.version).to.equal(packageJsonDist.version);
			}
		});
	});

	it('Fails with invalid tsconfig file', () => {
		return runTestCase({
			input: () => {
				clean(libCompile.main.path);
				ensureDir(libCompile.main.path);
				clean(libCompile.path + '/dist');
				writeTSConfig('{ invalid-json ');
				writeDummyTSFile();
			},
			error: {
				expected: 'Error compiling'
			}
		});
	});

	it('Fails gracefully with missing tsconfig.json', () => {
		return runTestCase({
			input: () => {
				clean(libCompile.main.path);
				ensureDir(libCompile.main.path);
				clean(libCompile.path + '/dist');
				writeDummyTSFile();
			},
			error: {
				expected: 'Error compiling'
			}
		});
	});

	it('Skips copyPackageJSONToOutput if packageJson.dist is not defined', () => {
		return runTestCase({
				input: () => {
					clean(libCompile.main.path);
					ensureDir(libCompile.main.path);
					clean(libCompile.path + '/dist');
					writeTSConfig();
					writeDummyTSFile();
				},
				result: async () => {
					expect(existsSync(resolve(libCompile.path, 'dist/package.json'))).to.be.false;
				}
			}
		);
	});
});
