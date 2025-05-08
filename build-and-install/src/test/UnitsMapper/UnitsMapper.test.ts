import {expect} from 'chai';
import {
	BaseUnit,
	Unit_FirebaseFunctionsApp,
	Unit_FirebaseFunctionsApp_Config,
	Unit_FirebaseHostingApp,
	Unit_NodeLib,
	Unit_NodeProject,
	UnitMapper_Base,
	UnitMapper_FirebaseFunction,
	UnitMapper_FirebaseHosting,
	UnitMapper_NodeLib,
	UnitMapper_NodeProject,
	UnitsMapper
} from '../_common';
import {BadImplementationException, sortArray} from '@nu-art/ts-common';
import {defaultTestProcessor, DefaultTestProcessor, runSingleTestCase, TestCase_Error} from '@nu-art/ts-common/testing/consts';
import {TestSuite} from '@nu-art/ts-common/testing/types';

export type Input = {
	pathToProject: string,
	rules: UnitMapper_Base<BaseUnit<any>>[]
}

export type Result = BaseUnit<any>[]
export type TestSuite_UnitsMapper = TestSuite<Input, Result>;
export type TestCase_UnitsMapper = TestSuite_UnitsMapper['testcases'][number];


const test = async (input: Input): Promise<Result> => {
	return await new UnitsMapper()
		.addRules(...input.rules)
		.resolveUnits(input.pathToProject);
};
const runTestCase = (testCase: TestCase_UnitsMapper, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

const testValidator: DefaultTestProcessor = async (promisedResult: Promise<Result>, expectedResult?: (Result | (() => Promise<any>)), error?: TestCase_Error) => {
	if (error)
		return expect(promisedResult).to.be.rejectedWith(error.expected);
	else if (!expectedResult)
		throw new BadImplementationException('MUST provide expectedResult or error');

	if (typeof expectedResult === 'function')
		return await (expectedResult as () => Promise<any>)();

	const result = sortArray(await promisedResult, unit => unit.config.relativePath);
	const expected = sortArray(expectedResult, unit => unit.config.relativePath);
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

describe('UnitsMapper', () => {


	it('Project with root', runTestCase({
		input: {
			pathToProject: `${__dirname}/cases/test-case-1`,
			rules: [UnitMapper_NodeProject]
		},
		result: [new Unit_NodeProject({
			key: 'test-case-1',
			customTSConfig: false,
			customESLintConfig: false,
			label: 'Test case 1 - root ts',
			relativePath: '.',
			fullPath: `${__dirname}/cases/test-case-1`,
			isRoot: true,
			dependencies: {
				'typescript': 'latest'
			}
		})]
	}, testValidator));

	it('Project with root and one ts lib', runTestCase({
		input: {
			pathToProject: `${__dirname}/cases/test-case-2`,
			rules: [UnitMapper_NodeLib, UnitMapper_NodeProject]
		},
		result: [
			new Unit_NodeProject({
				key: 'test-case-2',
				label: 'Test case 2 - root ts',
				relativePath: '.',
				fullPath: `${__dirname}/cases/test-case-2`,
				isRoot: true,
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-2--lib-1',
				label: 'Test case 2 - lib-1 ts',
				relativePath: './lib-1',
				fullPath: `${__dirname}/cases/test-case-2/lib-1`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			})
		]
	}, testValidator));

	it('Project with root and two ts lib', runTestCase({
		input: {
			pathToProject: `${__dirname}/cases/test-case-3`,
			rules: [UnitMapper_NodeLib, UnitMapper_NodeProject]
		},
		result: [
			new Unit_NodeProject({
				key: 'test-case-3',
				label: 'Test case 3 - root ts',
				relativePath: '.',
				fullPath: `${__dirname}/cases/test-case-3`,
				isRoot: true,
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-3--lib-1',
				label: 'Test case 3 - lib-1 ts',
				relativePath: './lib-1',
				fullPath: `${__dirname}/cases/test-case-3/lib-1`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-3--lib-2',
				label: 'Test case 3 - lib-2 ts',
				relativePath: './lib-2',
				fullPath: `${__dirname}/cases/test-case-3/lib-2`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			})
		]
	}, testValidator));

	it('Project with root, function app and two ts lib', runTestCase({
		input: {
			pathToProject: `${__dirname}/cases/test-case-4`,
			rules: [UnitMapper_NodeLib, UnitMapper_NodeProject, UnitMapper_FirebaseFunction]
		},
		result: [
			new Unit_NodeProject({
				key: 'test-case-4',
				label: 'Test case 4 - root ts',
				relativePath: '.',
				fullPath: `${__dirname}/cases/test-case-4`,
				isRoot: true,
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-4--lib-1',
				label: 'Test case 4 - lib-1 ts',
				relativePath: './lib-1',
				fullPath: `${__dirname}/cases/test-case-4/lib-1`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-4--lib-2',
				label: 'Test case 4 - lib-2 ts',
				relativePath: './lib-2',
				fullPath: `${__dirname}/cases/test-case-4/lib-2`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_FirebaseFunctionsApp({
				basePort: 1,
				debugPort: 2,
				key: 'test-case-4--function-1',
				label: 'Test case 4 - function-1',
				relativePath: './func-app-1',
				fullPath: `${__dirname}/cases/test-case-4/func-app-1`,
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
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			} as Unit_FirebaseFunctionsApp_Config)
		]
	}, testValidator));

	it('Project with root, hosting app and two ts lib', runTestCase({
		input: {
			pathToProject: `${__dirname}/cases/test-case-5`,
			rules: [UnitMapper_NodeLib, UnitMapper_NodeProject, UnitMapper_FirebaseHosting]
		},
		result: [
			new Unit_NodeProject({
				key: 'test-case-5',
				label: 'Test case 5 - root ts',
				relativePath: '.',
				fullPath: `${__dirname}/cases/test-case-5`,
				isRoot: true,
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-5--lib-1',
				label: 'Test case 5 - lib-1 ts',
				relativePath: './lib-1',
				fullPath: `${__dirname}/cases/test-case-5/lib-1`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-5--lib-2',
				label: 'Test case 5 - lib-2 ts',
				relativePath: './lib-2',
				fullPath: `${__dirname}/cases/test-case-5/lib-2`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_FirebaseHostingApp({
				servingPort: 1,
				key: 'test-case-5--hosting-1',
				label: 'Test case 5 - hosting-1',
				relativePath: './hosting-app-1',
				fullPath: `${__dirname}/cases/test-case-5/hosting-app-1`,
				output: 'dist',
				envs: {
					local: {
						isLocal: true,
						configUrl: 'https://localhost:xxx:/path/to/config.json',
						projectId: 'beamz-dev',
					}
				},
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			})
		]
	}, testValidator));

	it('Project with root, function app, hosting app and two ts lib', runTestCase({
		input: {
			pathToProject: `${__dirname}/cases/test-case-6`,
			rules: [UnitMapper_NodeLib, UnitMapper_NodeProject, UnitMapper_FirebaseHosting, UnitMapper_FirebaseFunction]
		},
		result: [
			new Unit_NodeProject({
				key: 'test-case-6',
				label: 'Test case 6 - root ts',
				relativePath: '.',
				fullPath: `${__dirname}/cases/test-case-6`,
				isRoot: true,
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-6--lib-1',
				label: 'Test case 6 - lib-1 ts',
				relativePath: './lib-1',
				fullPath: `${__dirname}/cases/test-case-6/lib-1`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_NodeLib({
				key: 'test-case-6--lib-2',
				label: 'Test case 6 - lib-2 ts',
				relativePath: './lib-2',
				fullPath: `${__dirname}/cases/test-case-6/lib-2`,
				output: 'dist',
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),
			new Unit_FirebaseFunctionsApp({
				basePort: 1,
				debugPort: 2,
				key: 'test-case-6--function-1',
				label: 'Test case 6 - function-1',
				relativePath: './func-app-1',
				fullPath: `${__dirname}/cases/test-case-6/func-app-1`,
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
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			} as Unit_FirebaseFunctionsApp_Config),
			new Unit_FirebaseHostingApp({
				servingPort: 1,
				key: 'test-case-6--hosting-1',
				label: 'Test case 6 - hosting-1',
				relativePath: './hosting-app-1',
				fullPath: `${__dirname}/cases/test-case-6/hosting-app-1`,
				output: 'dist',
				envs: {
					local: {
						isLocal: true,
						configUrl: 'https://localhost:xxx:/path/to/config.json',
						projectId: 'beamz-dev',
					}
				},
				dependencies: {},
				customESLintConfig: false,
				customTSConfig: false,
			}),

		]
	}, testValidator));
});
