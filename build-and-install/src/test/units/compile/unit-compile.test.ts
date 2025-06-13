// file: ./tests/phase-execution/compile-phase.test.ts
import {DebugFlag, LogLevel} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {FileSystemUtils, phase_Install, phase_Prepare, Unit_TypescriptLib} from '../../_common';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3';
import {CONST_PackageJSON} from '../../../main/core/consts';
import {FilesCache} from '../../../main/v3/core/FilesCache';

DebugFlag.DefaultLogLevel = LogLevel.Verbose;

const pathToTemp = resolve(__dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(__dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

let unit: Unit_TypescriptLib;
let buildAndInstall: BuildAndInstall;

type Input = {
	fixtures: string[];
	compileWatch?: boolean;
};
type Output = () => (Promise<void>);

const test = async (setup: Input): Promise<void> => {
	FilesCache.clear();
	workspaceCreator.setupWorkspace(setup.fixtures, 'lib-compile');

	buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
	await buildAndInstall.build();
	unit = buildAndInstall.projectUnits.find(unit => unit.config.key == 'lib-compile') as Unit_TypescriptLib;

	if (setup.compileWatch)
		await unit.watchCompile();
	else
		await unit.compile();
};

type TestSuite_PhaseCompile = TestSuite<Input, Output>;
type TestCase_PhaseCompile = TestSuite_PhaseCompile['testcases'][number];

const runTestCase = (testCase: TestCase_PhaseCompile, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Unit_NodeLib - Compile Phase', () => {
	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
		workspaceCreator.setupWorkspace(['workspace.txt']);

		buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
		await buildAndInstall.build();
		buildAndInstall.setPhases([[phase_Prepare, phase_Install]]);
		await buildAndInstall.run();
	});

	it('Compile - Creates output folder if it does not exist', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-valid.txt']},
		result: async () => {
			expect(existsSync(unit.config.output)).to.be.true;
		}
	}));

	it('Compile - Valid tsconfig and outputs JS to dist', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-valid.txt']},
		result: async () => {
			const compiledJS = resolve(unit.config.output, 'index.js');
			expect(existsSync(compiledJS)).to.be.true;
		}
	}));

	it('Compile - Copies assets (e.g. .svg) to dist folder', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-with-asset.txt']},
		result: async () => {
			expect(existsSync(resolve(unit.config.output, 'file.svg'))).to.be.true;
		}
	}));

	it('Compile - Writes dist/package.json with correct content', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-valid.txt']},
		result: async () => {
			const distPackageJson = resolve(unit.config.output, CONST_PackageJSON);
			expect(existsSync(distPackageJson)).to.be.true;
		}
	}));

	it('Compile - Fails with invalid tsconfig file', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-invalid-tsconfig.txt']},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Compile - Fails gracefully with missing tsconfig.json', runTestCase({
		input: {fixtures: ['./lib-compile--fail.txt', './workspace-compile-missing-tsconfig.txt']},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Compile - Fails on syntax error in source', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-invalid-source.txt']},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Watch Compile - Fails on syntax error in source using watchCompile()', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-invalid-source.txt'], compileWatch: true},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Watch Compile - Outputs JS to dist', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-valid.txt'], compileWatch: true},
		result: async () => {
			const compiledJS = resolve(unit.config.output, 'index.js');
			expect(existsSync(compiledJS)).to.be.true;
		}
	}));

	it('Watch Compile - Fails with invalid tsconfig', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-invalid-tsconfig.txt'], compileWatch: true},
		error: {
			expected: 'Error compiling'
		}
	}));

	it('Watch Compile - Copies assets (e.g. .svg) to dist folder', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-with-asset.txt'], compileWatch: true},
		result: async () => {
			expect(existsSync(resolve(unit.config.output, 'file.svg'))).to.be.true;
		}
	}));


	after(async function () {
		// const allPassed = this.test?.parent?.tests.every(t => t.state === 'passed');
		// if (allPassed)
		// 	await FileSystemUtils.folder.delete(pathToTemp);

		await CommandoPool.killAll();
	});
});
