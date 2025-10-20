// file: ./tests/phase-execution/lint-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {FileSystemUtils, phase_Install, phase_Prepare, Unit_TypescriptLib} from '../../_common.js';
import {resolve} from 'path';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {FilesCache} from '../../../main/v3/core/FilesCache.js';
import {___dirname} from '@nu-art/ts-common/esm';

const dirname = ___dirname(import.meta.url);

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

let unit: Unit_TypescriptLib;
let buildAndInstall: BuildAndInstall;


type Input = { fixtures: string[] };
type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	FilesCache.clear();
	workspaceCreator.setupWorkspace(setup.fixtures, '', false);
	unit = buildAndInstall.projectUnits.find(unit => unit.config.key == 'lib-lint') as Unit_TypescriptLib;
	await unit.lint();
};

type TestSuite_LintPhase = TestSuite<Input, Output>;
type TestCase_LintPhase = TestSuite_LintPhase['testcases'][number];
const runTestCase = (testCase: TestCase_LintPhase) => () => runSingleTestCase(test, testCase);

describe('TypescriptLib - Lint Phase', () => {
	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
		workspaceCreator.setupWorkspace(['workspace.txt']);
		workspaceCreator.setupWorkspace(['project-lib-lint.txt'], 'lib-lint');

		buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
		await buildAndInstall.build();
		buildAndInstall.setPhases([[phase_Prepare], [phase_Install]]);
		await buildAndInstall.run();
	});


	it('Should pass linting without errors', runTestCase(() => {
		return {
			input: {fixtures: ['./project-lib-lint--valid.txt']},
			result: async () => {
				expect(true).to.be.true; // Placeholder until lint result is assertable
			}
		};
	})).timeout(15000);

	it('Should fail linting on invalid code', runTestCase(() => {
		return {
			input: {fixtures: ['./project-lib-lint--invalid.txt']},
			error: {
				expected: 'Linting failed'
			}
		};
	})).timeout(15000);

	after(async function () {
		const allPassed = this.test?.parent?.tests.every(t => t.state === 'passed');
		if (allPassed)
			await FileSystemUtils.folder.delete(pathToTemp);

		await CommandoPool.killAll();
	});
});
