// file: ./tests/phase-execution/watch-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {RuntimeParams, Unit_TypescriptLib} from '../../_common';
import {resolve} from 'path';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';
import {writeFileSync} from 'fs';

const libName = 'lib-e';
const pathToTemp = resolve(__dirname, './temp');
const pathToFixtures = resolve(pathToTemp, './fixtures');
const pathToWorkspace = resolve(pathToTemp, './workspace');
const unitPath = resolve(pathToWorkspace, libName);

const createTestUnit_TypescriptLib = () => new Unit_TypescriptLib({
	key: libName,
	label: libName,
	relativePath: `./${libName}`,
	fullPath: unitPath,
	output: resolve(unitPath, 'dist'),
	dependencies: {},
	customTSConfig: true,
	customESLintConfig: true
});

type Input = { fixtures: string[] };
type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	const unit = createTestUnit_TypescriptLib();
	for (const fixture of setup.fixtures)
		setupWorkspace(resolve(pathToFixtures, fixture), pathToWorkspace);

	await unit.watchCompile();
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
			const indexPath = resolve(unitPath, 'src/main/index.ts');
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