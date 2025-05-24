// file: ./tests/phase-execution/prepare-phase.test.ts
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {resolve} from 'path';
import {expect} from 'chai';
import {FileSystemUtils} from '../../_common';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {BuildAndInstall} from '../../../main/build-and-install-v3';
import {Unit_TypescriptLib} from '../../_common';
import {existsSync} from 'fs';
import {FilesCache} from '../../../main/v3/core/FilesCache';

const pathToTemp = resolve(__dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(__dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

let unit: Unit_TypescriptLib;
let buildAndInstall: BuildAndInstall;

type Input = {
	fixtures: string[];
};
type Output = () => Promise<void>;

const test = async (input: Input): Promise<void> => {
	FilesCache.clear();
	workspaceCreator.setupWorkspace(['workspace.txt']);
	workspaceCreator.setupWorkspace(input.fixtures, 'lib-prepare');
	buildAndInstall = new BuildAndInstall(pathToWorkspace);
	await buildAndInstall.build();

	unit = buildAndInstall.projectUnits.find(u => u.config.key === 'lib-prepare') as Unit_TypescriptLib;
	await unit.prepare();
};

type TestSuite_Prepare = TestSuite<Input, Output>;
type TestCase_Prepare = TestSuite_Prepare['testcases'][number];
const runTestCase = (testCase: TestCase_Prepare, processor = defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Unit_NodeLib - Prepare Phase', () => {
	before(async function () {
		this.timeout(10000);
		await FileSystemUtils.folder.delete(pathToTemp);
		fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
	});

	it('Prepare - Copies __package.json to package.json with no templates', runTestCase({
		input: {fixtures: ['./lib-prepare--static.txt']},
		result: async () => {
			const pkgJson = resolve(unit.config.fullPath, 'package.json');
			expect(existsSync(pkgJson)).to.be.true;
			const packageJson = await FileSystemUtils.file.read(pkgJson);
			const __packageJson = await FileSystemUtils.file.read(resolve(unit.config.fullPath, '__package.json'));
			expect(packageJson.trim()).to.equal(__packageJson.trim());
		}
	}));

	it('Prepare - Resolves simple $template values from package.json', runTestCase({
		input: {fixtures: ['./lib-prepare--templated.txt']},
		result: async () => {
			const pkgJson = resolve(unit.config.fullPath, 'package.json');
			const json = require(pkgJson);
			expect(json.version).to.equal('1.0.1');
		}
	}));

	it('Prepare - Fails when required template param is missing', runTestCase({
		input: {fixtures: ['./lib-prepare--unknown-template.txt']},
		error: {expected: 'Missing template param'}
	}));

	it('Prepare - Replaces multiple instances of the same template param', runTestCase({
		input: {fixtures: ['./lib-prepare--repeated-template.txt']},
		result: async () => {
			const pkgJson = resolve(unit.config.fullPath, 'package.json');
			const content = await FileSystemUtils.file.read(pkgJson);
			expect(content.match(/1\.0\.1/g)?.length).to.equal(2);
		}
	}));

	it('Prepare - Does not replace escaped template param $$escaped', runTestCase({
		input: {fixtures: ['./lib-prepare--escaped-template.txt']},
		result: async () => {
			const pkgJson = resolve(unit.config.fullPath, 'package.json');
			const content = await FileSystemUtils.file.read(pkgJson);
			expect(content).to.contain('$escaped');
		}
	}));

	it('Prepare - Does not replace numeric template param $2024', runTestCase({
		input: {fixtures: ['./lib-prepare--numeric-template.txt']},
		result: async () => {
			const pkgJson = resolve(unit.config.fullPath, 'package.json');
			const content = await FileSystemUtils.file.read(pkgJson);
			expect(content).to.contain('$2024');
		}
	}));

	it('Prepare - Does not match template keys under 3 chars (e.g., $ab)', runTestCase({
		input: {fixtures: ['./lib-prepare--short-template.txt']},
		result: async () => {
			const pkgJson = resolve(unit.config.fullPath, 'package.json');
			const content = await FileSystemUtils.file.read(pkgJson);
			expect(content).to.contain('$ab');
		}
	}));

	it('Prepare - Does not replace shell-style escaped template param \$ENV', runTestCase({
		input: {fixtures: ['./lib-prepare--escaped-shell-template.txt']},
		result: async () => {
			const pkgJson = resolve(unit.config.fullPath, 'package.json');
			const content = await FileSystemUtils.file.read(pkgJson);
			expect(content).to.contain('\\$SINGLE_ESCAPE');
			expect(content).to.contain('\\\\$DOUBLE_ESCAPE');
		}
	}));

	after(async function () {
		const allPassed = this.test?.parent?.tests.every(t => t.state === 'passed');
		if (allPassed)
			await FileSystemUtils.folder.delete(pathToTemp);
	});
});
