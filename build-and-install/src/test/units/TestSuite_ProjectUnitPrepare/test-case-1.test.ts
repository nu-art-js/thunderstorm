import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {ProjectUnit, Unit_NodeLib} from '../../_common';
import {existsSync, readFileSync, rmSync} from 'fs';
import {resolve} from 'path';
import {expect} from 'chai';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';

const pathToPackages = resolve(__dirname, 'workspace/packages');
const baiDefaultsPath = resolve(__dirname, 'fixtures/bai-defaults');
const projectRoot = resolve(__dirname, 'workspace');

const projectDefaultsPath = resolve(projectRoot, 'defaults/tsconfig.json');


type Input = ResolvableContent<{
	units: [ProjectUnit<any>],
	before: VoidFunction,
	paths: { projectRoot: string, baiDefaultsPath: string }
}>;
type Output = () => void;

const lib1Name = 'lib-1';
const unitRootLib1 = resolve(pathToPackages, lib1Name);
const eslintConfigPathLib1 = resolve(unitRootLib1, '.eslintrc.json');
const tsconfigMainPathLib1 = resolve(unitRootLib1, 'src/main/tsconfig.json');

export const TestSuite_ProjectUnitPrepare: TestSuite<Input, Output> = {
	label: 'ProjectUnit - Prepare Workspace (BAI Defaults)',
	testcases: [
		() => {

			const unit = new Unit_NodeLib({
				key: 'test-case-1--lib-1',
				label: 'Test case 1 - lib-1',
				relativePath: `./${lib1Name}`,
				fullPath: unitRootLib1,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
			});

			return {
				description: 'Should copy bai-default tsconfig.json into src/main and .eslintrc.json to unit root',
				input: {
					units: [unit],
					before: () => {
						if (existsSync(tsconfigMainPathLib1))
							rmSync(tsconfigMainPathLib1);
						if (existsSync(eslintConfigPathLib1))
							rmSync(eslintConfigPathLib1);
					},
					paths: {projectRoot: `${projectRoot}1`, baiDefaultsPath}
				},
				result: () => {
					expect(existsSync(tsconfigMainPathLib1)).to.be.true;
					const expected = readFileSync(resolve(baiDefaultsPath, 'tsconfig-main.json'), 'utf-8');
					const actual = readFileSync(tsconfigMainPathLib1, 'utf-8');
					expect(actual).to.equal(expected);

					expect(existsSync(eslintConfigPathLib1)).to.be.true;
					const expectedEslint = readFileSync(resolve(baiDefaultsPath, '.eslintrc.json'), 'utf-8');
					const actualEslint = readFileSync(eslintConfigPathLib1, 'utf-8');
					expect(actualEslint).to.equal(expectedEslint);
				}
			};
		},

		() => {
			const unit = new Unit_NodeLib({
				key: 'test-case-2--lib-1',
				label: 'Test case 2 - lib-1 project fallback',
				relativePath: `./${lib1Name}`,
				fullPath: unitRootLib1,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
			});

			return {
				description: 'Should fallback to project-level tsconfig.json when BAI default is missing',
				input: {
					units: [unit],
					before: () => {
						if (existsSync(tsconfigMainPathLib1))
							rmSync(tsconfigMainPathLib1);

						if (existsSync(eslintConfigPathLib1))
							rmSync(eslintConfigPathLib1);
					},
					paths: {projectRoot, baiDefaultsPath}
				},
				result: () => {
					expect(existsSync(tsconfigMainPathLib1)).to.be.true;
					const expected = readFileSync(projectDefaultsPath, 'utf-8');
					const actual = readFileSync(tsconfigMainPathLib1, 'utf-8');
					expect(actual).to.equal(expected);
				}
			};
		},
		() => {
			const unit = new Unit_NodeLib({
				key: 'test-case-3--lib-1',
				label: 'Test case 3 - fail on missing defaults',
				relativePath: `./${lib1Name}`,
				fullPath: unitRootLib1,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
			});

			return {
				description: 'Should fail when neither bai-default nor project-level tsconfig exists',
				input: {
					units: [unit],
					before: () => {
						if (existsSync(tsconfigMainPathLib1))
							rmSync(tsconfigMainPathLib1);
						if (existsSync(eslintConfigPathLib1))
							rmSync(eslintConfigPathLib1);
					},
					paths: {projectRoot: `${projectRoot}1`, baiDefaultsPath: `${baiDefaultsPath}1`}
				},
				error: {
					expected: 'Missing tsconfig template for source folder: main'
				}
			};
		},

	],

	processor: async (testCase) => {
		const {units, paths, before} = resolveContent(testCase.input);
		const test = async () => {
			before();
			await Promise.all(units.map(u => u.prepare(paths)));
		};

		if ('error' in testCase) {
			await expect(test()).to.be.rejectedWith(testCase.error.expected, testCase.error.message);
			return;
		}

		await test();
		testCase.result();
	}
};

describe('ProjectUnit - Prepare Workspace (BAI Defaults)', () => testSuiteTester(TestSuite_ProjectUnitPrepare));

