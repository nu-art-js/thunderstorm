// file: ./tests/phase-execution/compile-phase.test.ts
import {DebugFlag, LogLevel, sleep} from '@nu-art/ts-common';
import {defaultTestProcessor, runSingleTestCase, TestModel} from '@nu-art/testalot';
import {phase_Install, phase_Prepare, Unit_TypescriptLib} from '../../_common.js';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {CONST_PackageJSON} from '../../../main/config/consts.js';
import {FilesCache} from '../../../main/core/FilesCache.js';
import {___dirname} from '@nu-art/ts-common/esm';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';

const dirname = ___dirname(import.meta.url);
DebugFlag.DefaultLogLevel = LogLevel.Verbose;

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

let unitLib1: Unit_TypescriptLib;
let buildAndInstall: BuildAndInstall;

type Input = {
	fixtures: string[];
	compileWatch?: boolean;
	compileLib2?: boolean;
};
type Output = () => (Promise<void>);

const test = async (setup: Input): Promise<void> => {
	FilesCache.clear();
	await workspaceCreator.setupWorkspace(setup.fixtures, 'lib-compile');

	buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
	await buildAndInstall.build();
	unitLib1 = buildAndInstall.projectUnits.find(unit => unit.config.key == 'lib-compile') as Unit_TypescriptLib;
	if (setup.compileLib2)
		await (buildAndInstall.projectUnits.find(unit => unit.config.key == 'lib-compile-2') as Unit_TypescriptLib).compile();

	if (setup.compileWatch)
		await unitLib1.watchCompile();
	else
		await unitLib1.compile();
};

type TestCase_PhaseCompile = TestModel<Input, Output>;

const runTestCase = (testCase: TestCase_PhaseCompile, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Unit_NodeLib - Compile Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(30000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
		await workspaceCreator.setupWorkspace(['workspace.txt']);
		await workspaceCreator.setupWorkspace(['lib-compile.txt'], 'lib-compile');
		await workspaceCreator.setupWorkspace(['lib-compile-2.txt'], 'lib-compile-2', false);

		buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
		buildAndInstall.runtimeParams.allUnits = true;

		await buildAndInstall.build();
		buildAndInstall.setPhases([[phase_Prepare], [phase_Install]]);
		await buildAndInstall.run();
	});

	it('Compile - Creates output folder if it does not exist', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-valid.txt']},
		result: async () => {
			expect(existsSync(unitLib1.config.output)).to.be.true;
		}
	}));

	it('Compile - Compile lib 2 - package.json', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-valid.txt'], compileLib2: true},
		result: async () => {
			expect(existsSync(unitLib1.config.output)).to.be.true;
		}
	})).timeout(50000);

	it('Compile - Valid tsconfig and outputs JS to dist', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-valid.txt']},
		result: async () => {
			const compiledJS = resolve(unitLib1.config.output, 'index.js');
			expect(existsSync(compiledJS)).to.be.true;
		}
	}));

	it('Compile - Copies assets (e.g. .svg) to dist folder', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-with-asset.txt']},
		result: async () => {
			expect(existsSync(resolve(unitLib1.config.output, 'file.svg'))).to.be.true;
		}
	}));

	it('Compile - Writes dist/package.json with correct content', runTestCase({
		input: {fixtures: ['./lib-compile.txt', './workspace-compile-valid.txt']},
		result: async () => {
			const distPackageJson = resolve(unitLib1.config.output, CONST_PackageJSON);
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
			const compiledJS = resolve(unitLib1.config.output, 'index.js');
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
			expect(existsSync(resolve(unitLib1.config.output, 'file.svg'))).to.be.true;
		}
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
