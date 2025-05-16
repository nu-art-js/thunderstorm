// file: ./tests/phase-execution/watch-phase.test.ts
import '../compile/unit-compile.test';
import '../../UnitsMapper/UnitsMapper.test';
import '../../UnitsDependencyMapper/reverse-dependency-mapper.test';
import '../../UnitsDependencyMapper/dependency-mapper.test';
import '../../UnitsDependencyMapper/dependency-filter.test';
import '../../UnitsDependencyMapper/transitive-dependencies.test';

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {FileSystemUtils, Unit_NodeProject, Unit_TypescriptLib} from '../../_common';
import {resolve} from 'path';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {readFileSync, writeFileSync} from 'fs';
import {DebugFlag, LogLevel, timeout} from '@nu-art/ts-common';
import {BuildAndInstall} from '../../../main/build-and-install-v3';

DebugFlag.DefaultLogLevel = LogLevel.Verbose;

const pathToTemp = resolve(__dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');

let projectUnit: Unit_NodeProject;
let libA: Unit_TypescriptLib;
// let libB: Unit_TypescriptLib;
// let libC: Unit_TypescriptLib;
// let libD: Unit_TypescriptLib;
// let libE: Unit_TypescriptLib;


type Input = {
	fixtures: string[];
	whileWatching: () => Promise<void>;
};

type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	for (const fixture of setup.fixtures)
		setupWorkspace(resolve(pathToFixtures, fixture), pathToWorkspace);

	const buildAndInstall = new BuildAndInstall(pathToWorkspace);
	await buildAndInstall.build();

	const projectUnits = buildAndInstall.projectUnits;
	libA = projectUnits.find(unit => unit.config.key == '@demo/lib-a') as Unit_TypescriptLib;
	// libB = projectUnits.find(unit => unit.config.key == '@demo/lib-b') as Unit_TypescriptLib;
	// libC = projectUnits.find(unit => unit.config.key == '@demo/lib-c') as Unit_TypescriptLib;
	// libD = projectUnits.find(unit => unit.config.key == '@demo/lib-d') as Unit_TypescriptLib;
	// libE = projectUnits.find(unit => unit.config.key == '@demo/lib-e') as Unit_TypescriptLib;
	projectUnit = buildAndInstall.nodeProjectUnit;
	buildAndInstall.runtimeParams.watch = true;
	await buildAndInstall.run();

	await timeout(500);
	await setup.whileWatching?.();
	await projectUnit.stopWatch();
};

type TestSuite_WatchPhase = TestSuite<Input, Output>;
type TestCase_WatchPhase = TestSuite_WatchPhase['testcases'][number];
const runTestCase = (testCase: TestCase_WatchPhase) => () => runSingleTestCase(test, testCase);

describe('TypescriptLib - Watch Phase', () => {
	before(() => {
		setupWorkspace(resolve(__dirname, './fixtures.txt'), pathToTemp);
	});

	it('Should rebuild lib-a when its source is changed', runTestCase({
		input: {
			fixtures: ['./workspace-demo-project.txt'],
			whileWatching: async () => {
				const filePath = resolve(libA.config.fullPath, 'src/main/index.ts');
				writeFileSync(filePath, `export const libA = () => 'changed';`, {encoding: 'utf-8'});
				await timeout(8000);
			}
		},
		result: async () => {
			const output = await FileSystemUtils.file.read(resolve(pathToWorkspace, 'lib-a/dist/index.js'));
			expect(output).to.include('changed');
		}
	})).timeout(20000);

	it('Should rebuild lib-e when lib-a changes (propagated)', runTestCase({
		input: {
			fixtures: ['./workspace-demo-project.txt'],
			whileWatching: async () => {
				const filePath = resolve(libA.config.fullPath, 'src/main/index.ts');
				writeFileSync(filePath, `export const libA = () => 'changed-in-a';`);
				await timeout(4000);
			}
		},
		result: async () => {
			const distPath = resolve(pathToWorkspace, 'lib-e/dist/index.js');
			const output = readFileSync(distPath, 'utf-8');
			expect(output).to.include('changed-in-a');
		}
	})).timeout(20000);

	it('Calling watch twice will fail', runTestCase({
		input: {
			fixtures: ['./workspace-demo-project.txt'],
			whileWatching: async () => {
				await projectUnit.watch();
				await new Promise(res => setTimeout(res, 500));
			}
		},
		error: {
			expected: 'Watcher already initialized'
		}
	}));

	after(async () => {
		// await FileSystemUtils.folder.delete(pathToTemp);
		await projectUnit.stopWatch();
		await CommandoPool.killAll();
	});
});
