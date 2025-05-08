// file: ./tests/phase-execution/purge-phase.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {Unit_TypescriptLib, Unit_NodeProject, Unit_PackageJson} from '../../_common';
import {resolve} from 'path';
import {existsSync} from 'fs';
import {expect} from 'chai';
import {setupWorkspace} from '@nu-art/ts-common/testing/workspace-creator';

const pathToPackages = resolve(__dirname, './workspace/packages');
const libName = 'lib-purge';
const unitPath = resolve(pathToPackages, libName);

const createTestUnit_TypescriptLib = () => new Unit_TypescriptLib({
	key: libName,
	label: libName,
	relativePath: `./${libName}`,
	fullPath: unitPath,
	output: resolve(unitPath, 'dist'),
	dependencies: {},
	customTSConfig: true,
	customESLintConfig: true,
});

const projectName = 'workspace';
const pathToProject = resolve(__dirname, './workspace');
const createTestUnit_NodeProject = () => new Unit_NodeProject({
	key: projectName,
	label: projectName,
	relativePath: `.`,
	fullPath: pathToProject,
	dependencies: {},
	isRoot: true,
	globalPackages: {}
});

type Input = {
	fixtures: string[]
	units: Unit_PackageJson
};
type Output = () => void;

const test = async (setup: Input): Promise<void> => {
	for (const fixture of setup.fixtures) {
		setupWorkspace(resolve(__dirname, fixture), setup.units.config.fullPath);
	}
	const unit = setup.units;
	await unit.purge();
};

type TestSuite_UnitPurge = TestSuite<Input, Output>;
type TestCase_UnitPurge = TestSuite_UnitPurge['testcases'][number];
const runTestCase = (testCase: TestCase_UnitPurge) => () => runSingleTestCase(test, testCase);

describe('Unit - Purge Phase', () => {
	before(() => {
		setupWorkspace(resolve(__dirname, './fixtures.txt'), resolve(__dirname, './fixtures'));
	});

	it('TypescriptLib - purge node_modules and dist', runTestCase(() => {
		const libUnit = createTestUnit_TypescriptLib();
		return {
			input: {
				fixtures: ['./fixtures/workspace-purge-node-lib.txt'],
				units: libUnit,
			},
			result: async () => {
				expect(existsSync(resolve(libUnit.config.fullPath, 'node_modules'))).to.be.false;
				expect(existsSync(resolve(libUnit.config.fullPath, libUnit.config.output))).to.be.false;
			}
		};
	}));

	it('Project Unit - purge node_modules and and lock files', runTestCase(() => {
		const projectUnit = createTestUnit_NodeProject();
		return {
			input: {
				fixtures: ['./fixtures/workspace-purge-root-project.txt'],
				units: projectUnit,
			},
			result: async () => {
				expect(existsSync(resolve(projectUnit.config.fullPath, 'node_modules'))).to.be.false;
				expect(existsSync(resolve(projectUnit.config.fullPath, 'pnpm-lock.yaml'))).to.be.false;
				expect(existsSync(resolve(projectUnit.config.fullPath, 'pnpm-workspace.yaml'))).to.be.false;
				expect(existsSync(resolve(projectUnit.config.fullPath, 'package-lock.json'))).to.be.false;
			}
		};
	}));
});
