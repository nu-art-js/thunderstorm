// file: ./tests/phase-execution/lint-phase.test.ts

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {phase_Install, phase_Prepare, Unit_TypescriptLib} from '../../_common.js';
import {resolve} from 'path';
import {expect} from 'chai';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {FilesCache} from '../../../main/core/FilesCache.js';
import {___dirname} from '@nu-art/ts-common/esm';
import {sleep} from '@nu-art/ts-common';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';

const dirname = ___dirname(import.meta.url);

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

let buildAndInstall: BuildAndInstall;


type Input = { fixtures: string[] };
type Output = () => Promise<void>;

const test = async (setup: Input): Promise<void> => {
	FilesCache.clear();
	await workspaceCreator.setupWorkspace(setup.fixtures, '', false);
	const unit = buildAndInstall.workspace.getUnitByKey('lib-lint', Unit_TypescriptLib);
	await unit.lint();
};

type TestCase_LintPhase = TestModel<Input, Output>;
const runTestCase = (testCase: TestCase_LintPhase) => () => runSingleTestCase(test, testCase);

describe('TypescriptLib - Lint Phase', () => {
	let suiteHasFailures: boolean | undefined;

	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
		await workspaceCreator.setupWorkspace(['workspace.txt']);
		await workspaceCreator.setupWorkspace(['project-lib-lint.txt'], 'lib-lint');

		buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
		buildAndInstall.setPhases([[phase_Prepare], [phase_Install]]);

		await buildAndInstall.build();
		await buildAndInstall.run();
	});


	it('Should pass linting without errors', runTestCase({
		input: {fixtures: ['./project-lib-lint--valid.txt']},
		result: async () => {
			expect(true).to.be.true; // Placeholder until lint result is assertable
		}
	})).timeout(15000);

	it('Should fail linting on invalid code', runTestCase({
		input: {fixtures: ['./project-lib-lint--invalid.txt']},
		error: {
			expected: 'Linting failed'
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
