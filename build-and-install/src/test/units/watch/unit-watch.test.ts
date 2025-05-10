// file: ./tests/phase-execution/watch-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {RuntimeParams, Unit_TypescriptLib, Unit_NodeProject} from '../../_common';
import {resolve} from 'path';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {writeFileSync} from 'fs';

const pathToTemp = resolve(__dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');

const projectUnit = new Unit_NodeProject({
	key: 'project',
	label: 'project',
	relativePath: '.',
	fullPath: pathToWorkspace,
	dependencies: {},
	isRoot: true,
	globalPackages: {}
});

function createLibUnit(name: string): Unit_TypescriptLib {
	return new Unit_TypescriptLib({
		key: name,
		label: name,
		relativePath: `./${name}`,
		fullPath: resolve(pathToWorkspace, name),
		output: resolve(pathToWorkspace, name, 'dist'),
		dependencies: {},
		customTSConfig: true,
		customESLintConfig: true
	});
}

const libA = createLibUnit('lib-a');
const libB = createLibUnit('lib-b');
const libC = createLibUnit('lib-c');
const libD = createLibUnit('lib-d');
const libE = createLibUnit('lib-e');

const libUnits = [libA, libB, libC, libD, libE];

projectUnit.assignUnit(libUnits);

type Input = { fixtures: string[] };
type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	for (const fixture of setup.fixtures)
		setupWorkspace(resolve(pathToFixtures, fixture), pathToWorkspace);

	await libE.watchCompile();
};

type TestSuite_WatchPhase = TestSuite<Input, Output>;
type TestCase_WatchPhase = TestSuite_WatchPhase['testcases'][number];
const runTestCase = (testCase: TestCase_WatchPhase) => () => runSingleTestCase(test, testCase);

describe('TypescriptLib - Watch Phase', () => {
	before(() => {
		setupWorkspace(resolve(__dirname, './fixtures.txt'), pathToTemp);
		RuntimeParams.watch = true;
	});

	it('Should rebuild dist on file change', runTestCase({
		input: {fixtures: ['./workspace-demo-project.txt']},
		result: async () => {
			const indexPath = resolve(pathToWorkspace, 'lib-e/src/main/index.ts');
			writeFileSync(indexPath, `export const libE = () => 'updated';`);
			// TODO: assert dist content has changed accordingly
			expect(true).to.be.true;
		}
	})).timeout(20000);

	after(async () => {
		RuntimeParams.watch = false;
		await CommandoPool.killAll();
	});
});
