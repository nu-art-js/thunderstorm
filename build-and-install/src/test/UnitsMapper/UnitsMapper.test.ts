import {Unit_FirebaseFunctionsApp, Unit_FirebaseHostingApp, Unit_NodeProject, Unit_TypescriptLib} from '../_common.js';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {resolve} from 'path';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {BuildAndInstall} from '../../main/build-and-install-v3.js';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {___dirname} from '@nu-art/ts-common/esm';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';

const dirname = ___dirname(import.meta.url);

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

export type Input = {
	fixtures: string[],
}

export type Result = {
	key: string,
	type: string,
	relativePath: string,
	outputPath: string | undefined,
}[]
export type TestSuite_UnitsMapper = TestSuite<Input, Result>;
export type TestCase_UnitsMapper = TestSuite_UnitsMapper['testcases'][number];


let buildAndInstall: BuildAndInstall;
const test = async (input: Input): Promise<Result> => {
	await workspaceCreator.setupWorkspace(['workspace.txt', ...input.fixtures]);
	buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
	await buildAndInstall.build();

	return buildAndInstall.projectUnits.map(unit => {
		return {
			key: unit.config.key,
			type: unit.constructor.name,
			relativePath: unit.config.relativePath,
			outputPath: ('output' in unit.config ? unit.config.output : undefined) as string | undefined,
		};
	});
};

const runTestCase = (testCase: TestCase_UnitsMapper, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('UnitsMapper', () => {
	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		await fixtureTemplateExtractor.setupWorkspace(['../workspace-fixture.txt', 'fixtures.txt']);
	});

	it('Project with root, function app, hosting app and two ts lib', runTestCase({
			input: {
				fixtures: ['full-workspace.txt'],
			},
			result: [
				{
					type: Unit_NodeProject.name,
					key: 'project-root',
					relativePath: '.',
					outputPath: undefined
				},
				{
					type: Unit_FirebaseFunctionsApp.name,
					key: 'function-1',
					relativePath: './func-app-1',
					outputPath: resolve(pathToWorkspace, './func-app-1/dist')
				},
				{
					type: Unit_FirebaseHostingApp.name,
					key: 'hosting-1',
					relativePath: './hosting-app-1',
					outputPath: resolve(pathToWorkspace, './hosting-app-1/dist')
				},
				{
					type: Unit_TypescriptLib.name,
					key: 'lib-1',
					relativePath: './lib-1',
					outputPath: resolve(pathToWorkspace, './lib-1/dist')
				},
				{
					type: Unit_TypescriptLib.name,
					key: 'lib-2',
					relativePath: './lib-2',
					outputPath: resolve(pathToWorkspace, './lib-2/dist')
				},
			]
		})
	);

	after(async function () {
		const allPassed = this.test?.parent?.tests.every(t => t.state === 'passed');
		if (allPassed)
			await FileSystemUtils.folder.delete(pathToTemp);

		await CommandoPool.killAll();
	});
});
