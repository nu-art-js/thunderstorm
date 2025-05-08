// file: ./tests/phase-execution/purge-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {Unit_NodeLib} from '../../_common';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';

const pathToPackages = resolve(__dirname, './workspace/packages');
const libName = 'lib-purge';
const unitPath = resolve(pathToPackages, libName);

const createTestUnit_NodeLib = () => new Unit_NodeLib({
	key: libName,
	label: libName,
	relativePath: `./${libName}`,
	fullPath: unitPath,
	output: resolve(unitPath, 'dist'),
	dependencies: {},
	customTSConfig: true,
	customESLintConfig: true,
});

type Input = string;
type Output = () => void;

const test = async (fixtureFile: Input): Promise<void> => {
	setupWorkspace(resolve(__dirname, fixtureFile), unitPath);
	const unit = createTestUnit_NodeLib();
	await unit.purge();
};

type TestSuite_UnitPurge = TestSuite<Input, Output>;
type TestCase_UnitPurge = TestSuite_UnitPurge['testcases'][number];
const runTestCase = (testCase: TestCase_UnitPurge) => () => runSingleTestCase(test, testCase);

describe('Unit - Purge Phase', () => {
	before(() => {
		setupWorkspace(resolve(__dirname, './fixtures.txt'), resolve(__dirname, './fixtures'));
	});

	it('Removes node_modules and lock files if they exist', runTestCase({
		input: './fixtures/workspace-purge-node-lib.txt',
		result: async () => {
			expect(existsSync(resolve(unitPath, 'node_modules'))).to.be.false;
			expect(existsSync(resolve(unitPath, 'pnpm-lock.yaml'))).to.be.false;
			expect(existsSync(resolve(unitPath, 'package-lock.json'))).to.be.false;
		}
	}));
});
