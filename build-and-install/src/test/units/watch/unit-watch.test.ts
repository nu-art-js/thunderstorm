// file: ./tests/phase-execution/watch-phase.test.ts
import {DebugFlag, LogLevel, timeCounter, timeout} from '@nu-art/ts-common';
import '../compile/unit-compile.test.js';
import '../../UnitsMapper/UnitsMapper.test.js';
import '../../UnitsDependencyMapper/reverse-dependency-mapper.test.js';
import '../../UnitsDependencyMapper/dependency-mapper.test.js';
import '../../UnitsDependencyMapper/dependency-filter.test.js';
import '../../UnitsDependencyMapper/transitive-dependencies.test.js';

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {FileSystemUtils, phase_Install, phase_Prepare, Unit_NodeProject, Unit_TypescriptLib} from '../../_common.js';
import {TestWorkspaceCreator} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {BuildAndInstall} from '../../../main/build-and-install-v3.js';
import {___dirname} from '@nu-art/ts-common/esm';
import {resolve} from 'path';

const dirname = ___dirname(import.meta.url);

DebugFlag.DefaultLogLevel = LogLevel.Verbose;

const pathToTemp = resolve(dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const fixtureTemplateExtractor = new TestWorkspaceCreator(dirname, pathToFixtures);
const workspaceCreator = new TestWorkspaceCreator(pathToFixtures, pathToWorkspace);

let projectUnit: Unit_NodeProject;
let buildAndInstall: BuildAndInstall;


type Input = {
	fixtures: string[];
	beforeWatching?: (bai: BuildAndInstall) => Promise<void>;
	whileWatching: (bai: BuildAndInstall) => Promise<void>;
	waitFor: {
		interval?: number;
		timeout?: number;
		predicate: () => Promise<boolean>;
	};
};

type Output = boolean;

const test = async (setup: Input): Promise<boolean> => {
	const bai = new BuildAndInstall({pathToProject: pathToWorkspace});
	bai.runtimeParams.watchBuildTree = false;
	bai.runtimeParams.allUnits = true;

	await bai.build();
	projectUnit = bai.nodeProjectUnit;
	await setup.beforeWatching?.(bai);

	bai.nodeProjectUnit.watch(100, 200).then(async () => {
		console.log('watching ENDED');
	}, async () => {
		console.log('watching error');
	});

	await timeout(500);
	await setup.whileWatching?.(bai);
	const counter = timeCounter();
	let fulfilled = false;
	while (counter.dt() < (setup.waitFor.timeout ?? 5000)) {
		await timeout(setup.waitFor.interval ?? 500);
		fulfilled = await setup.waitFor.predicate();
		if (fulfilled)
			break;
	}
	await projectUnit.stopWatch();
	return fulfilled;
};

type TestSuite_WatchPhase = TestSuite<Input, Output>;
type TestCase_WatchPhase = TestSuite_WatchPhase['testcases'][number];
const runTestCase = (testCase: TestCase_WatchPhase) => () => runSingleTestCase(test, testCase);

describe('Phase Watch - 1 Lib', () => {
	before(async function () {
		this.timeout(20000);
		await FileSystemUtils.folder.delete(pathToTemp);
		fixtureTemplateExtractor.setupWorkspace(['../../workspace-fixture.txt', 'fixtures.txt']);
		workspaceCreator.setupWorkspace(['workspace.txt']);
		['lib-a', 'lib-b', 'lib-c', 'lib-d', 'lib-e'].forEach(libName => {
			workspaceCreator.setupWorkspace(['project-lib-config.txt', `${libName}.txt`], libName);
		});


		buildAndInstall = new BuildAndInstall({pathToProject: pathToWorkspace});
		buildAndInstall.runtimeParams.allUnits = true;

		await buildAndInstall.build();
		buildAndInstall.setPhases([[phase_Prepare], [phase_Install]]);
		await buildAndInstall.run();
	});

	it('Should rebuild lib-e when its source is changed', runTestCase({
		input: {
			fixtures: [],
			whileWatching: async (bai) => {
				const libE = bai.projectUnits.find(unit => unit.config.key == '@demo/lib-e') as Unit_TypescriptLib;
				const filePath = resolve(libE.config.fullPath, 'src/main/index.ts');
				await FileSystemUtils.file.write(filePath, `export const libE = () => 'changed';`);
			},
			waitFor: {
				predicate: async () => {
					try {
						const output = await FileSystemUtils.file.read(resolve(pathToWorkspace, 'lib-e/dist/index.js'));
						return output.includes('changed');
					} catch (e) {
						return false;
					}
				}
			}
		},
		result: true
	})).timeout(20000);

	it('Should rebuild lib-e when lib-a changes (propagated)', runTestCase({
		input: {
			fixtures: [],
			beforeWatching: async bai => {
				bai.runtimeParams.watchBuildTree = true;
				const libE = bai.projectUnits.find(unit => unit.config.key == '@demo/lib-e') as Unit_TypescriptLib;
				await FileSystemUtils.file.delete(resolve(libE.config.fullPath, 'dist/index.js'));
			},
			whileWatching: async (bai) => {
				const libA = bai.projectUnits.find(unit => unit.config.key == '@demo/lib-a') as Unit_TypescriptLib;
				const filePath = resolve(libA.config.fullPath, 'src/main/index.ts');
				await FileSystemUtils.file.write(filePath, `export const libA = () => 'changed';`);
			},
			waitFor: {
				predicate: async () => {
					try {
						return await FileSystemUtils.file.exists(resolve(pathToWorkspace, 'lib-e/dist/index.js'));
					} catch (e) {
						return false;
					}
				}
			}
		},
		result: true
	})).timeout(20000);
	//
	// it('Calling watch twice will fail', runTestCase({
	// 	input: {
	// 		fixtures: [],
	// 		whileWatching: async () => {
	// 			await projectUnit.watch();
	// 			await new Promise(res => setTimeout(res, 500));
	// 		}
	// 	},
	// 	error: {
	// 		expected: 'Watcher already initialized'
	// 	}
	// }));

	after(async function () {
		const allPassed = this.test?.parent?.tests.every(t => t.state === 'passed');
		if (allPassed)
			await FileSystemUtils.folder.delete(pathToTemp);

		await projectUnit.stopWatch();
		await CommandoPool.killAll();
	});
});
