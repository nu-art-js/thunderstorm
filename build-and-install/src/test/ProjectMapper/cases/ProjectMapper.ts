import {expect} from 'chai';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {ProjectMapper} from '../../../main/v2/phase-runner/ProjectMapper/ProjectMapper';
import {BaseUnit, Unit_TypescriptLib, Unit_TypescriptProject} from '../../../main/v2/unit/core';
import {
	UnitMapper_FirebaseFunction,
	UnitMapper_NodeLib,
	UnitMapper_NodeProject,
	Unit_FirebaseFunctionsApp,
	Unit_FirebaseFunctionsApp_Config
} from './test-common';
import {UnitMapper} from '../../../main/v2/phase-runner/ProjectMapper/resolvers/core';
import {sortArray} from '@nu-art/ts-common';

type Input = {
	pathToProject: string,
	rules: UnitMapper<BaseUnit<any>>[]
}
type Result = BaseUnit<any>[]


type TestSuite_ProjectMapper = TestSuite<Input, Result>;

const TestCase_ProjectMapper: TestSuite_ProjectMapper['testcases'] = [
	{
		description: 'Project with root',
		input: {
			pathToProject: `${__dirname}/test-case-1`,
			rules: [UnitMapper_NodeProject]
		},
		result: [new Unit_TypescriptProject({
			key: 'test-case-1',
			label: 'Test case 1 - root ts',
			relativePath: '.',
			fullPath: `${__dirname}/test-case-1`,
			isRoot: true,
		})]
	},
	{
		description: 'Project with root and one ts lib',
		input: {
			pathToProject: `${__dirname}/test-case-2`,
			rules: [UnitMapper_NodeLib, UnitMapper_NodeProject]
		},
		result: [
			new Unit_TypescriptProject({
				key: 'test-case-2',
				label: 'Test case 2 - root ts',
				relativePath: '.',
				fullPath: `${__dirname}/test-case-2`,
				isRoot: true,
			}),
			new Unit_TypescriptLib({
				key: 'test-case-2--lib-1',
				label: 'Test case 2 - lib-1 ts',
				relativePath: './lib-1',
				fullPath: `${__dirname}/test-case-2/lib-1`,
				output: 'dist'
			})
		]
	},
	{
		description: 'Project with root and two ts lib',
		input: {
			pathToProject: `${__dirname}/test-case-3`,
			rules: [UnitMapper_NodeLib, UnitMapper_NodeProject]
		},
		result: [
			new Unit_TypescriptProject({
				key: 'test-case-3',
				label: 'Test case 3 - root ts',
				relativePath: '.',
				fullPath: `${__dirname}/test-case-3`,
				isRoot: true,
			}),
			new Unit_TypescriptLib({
				key: 'test-case-3--lib-1',
				label: 'Test case 3 - lib-1 ts',
				relativePath: './lib-1',
				fullPath: `${__dirname}/test-case-3/lib-1`,
				output: 'dist'
			}),
			new Unit_TypescriptLib({
				key: 'test-case-3--lib-2',
				label: 'Test case 3 - lib-2 ts',
				relativePath: './lib-2',
				fullPath: `${__dirname}/test-case-3/lib-2`,
				output: 'dist'
			})
		]
	},
	{
		description: 'Project with root, function app and two ts lib',
		input: {
			pathToProject: `${__dirname}/test-case-4`,
			rules: [UnitMapper_NodeLib, UnitMapper_NodeProject, UnitMapper_FirebaseFunction]
		},
		result: [
			new Unit_TypescriptProject({
				key: 'test-case-4',
				label: 'Test case 4 - root ts',
				relativePath: '.',
				fullPath: `${__dirname}/test-case-4`,
				isRoot: true,
			}),
			new Unit_TypescriptLib({
				key: 'test-case-4--lib-1',
				label: 'Test case 4 - lib-1 ts',
				relativePath: './lib-1',
				fullPath: `${__dirname}/test-case-4/lib-1`,
				output: 'dist'
			}),
			new Unit_TypescriptLib({
				key: 'test-case-4--lib-2',
				label: 'Test case 4 - lib-2 ts',
				relativePath: './lib-2',
				fullPath: `${__dirname}/test-case-4/lib-2`,
				output: 'dist'
			}),
			new Unit_FirebaseFunctionsApp({
				basePort: 1,
				debugPort: 2,
				key: 'test-case-4--function-1',
				label: 'Test case 4 - function-1',
				relativePath: './func-app-1',
				fullPath: `${__dirname}/test-case-4/func-app-1`,
				output: 'dist',
				envs: {
					local: {
						defaultConfig: 'default',
						envConfig: 'local',
						isLocal: true,
						projectId: 'beamz-dev',
					}
				},
				pathToFirebaseConfig: '.firebase_config',
				sslCert: '.ssl/cert.pem',
				sslKey: '.ssl/key.pem',
			} as Unit_FirebaseFunctionsApp_Config)
		]
	},
];
const test = async (input: Input): Promise<Result> => {
	return await new ProjectMapper()
		.addRules(...input.rules)
		.resolveUnits(input.pathToProject);
};

export const TestSuite_ProjectMapper: TestSuite_ProjectMapper = {
	label: 'ProjectMapper',
	testcases: TestCase_ProjectMapper,
	processor: async (testCase) => {
		const input = testCase.input;
		const expected = testCase.result;

		// since base unit is a class there is a need to check and compare the class instance type and the config of the BaseUnit
		const compareBaseUnits = (result: BaseUnit<any>[], expected: BaseUnit<any>[]) => {
			expected = sortArray(expected, unit => unit.config.relativePath);
			for (let i = 0; i < expected.length; i++) {
				const expectedUnit = expected[i];
				const resultUnit = result[i];

				expect(resultUnit).to.not.be.undefined;

				// Check if both are instances of the same class
				expect(resultUnit.constructor.name).to.equal(expectedUnit.constructor.name);

				// Check if their configurations match (assuming `config` is a property of BaseUnit)
				expect(resultUnit['config']).to.deep.equal(expectedUnit['config']);
			}
		};

// Call the comparison helper function
		compareBaseUnits(await test(input), expected);
	}
};