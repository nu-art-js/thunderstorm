import {UnitDependentNode, UnitsDependencyMapper} from '../_common.js';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';

export type Input = { units: UnitDependentNode[], target: string[], exclude?: string[] };
export type Result = string[];

export type TestSuite_UnitsDependencyFilter = TestSuite<Input, Result>;
export type TestCase_UnitsDependencyFilter = TestSuite_UnitsDependencyFilter['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	const filter = new UnitsDependencyMapper(input.units);
	const pruned = filter.filterForTargets(input.target, input.exclude);
	return pruned.map(unit => unit.key).sort();
};

const runTestCase = (testCase: TestCase_UnitsDependencyFilter, processor?: typeof defaultTestProcessor) => () => {
	if ('result' in testCase)
		testCase.result = testCase.result.sort();

	return runSingleTestCase(test, testCase, processor);
};

describe('Units Dependency Filter', () => {
	it('filter for diamond graph (target = reports-service)', runTestCase({
		input: {
			units: [
				{key: 'shared-core', dependsOn: []},
				{key: 'user-lib', dependsOn: ['shared-core']},
				{key: 'analytics-lib', dependsOn: ['shared-core']},
				{key: 'reports-service', dependsOn: ['user-lib', 'analytics-lib']},
			],
			target: ['reports-service']
		},
		result: ['shared-core', 'user-lib', 'analytics-lib', 'reports-service']
	}));

	it('filter out one app from multi-app case', runTestCase({
		input: {
			units: [
				{key: 'shared-lib', dependsOn: []},
				{key: 'dashboard-app', dependsOn: ['shared-lib']},
				{key: 'monitor-app', dependsOn: ['shared-lib']},
			],
			target: ['dashboard-app']
		},
		result: ['shared-lib', 'dashboard-app']
	}));

	it('filter multi-app tree (admin-app + public-app)', runTestCase({
		input: {
			units: [
				{key: 'lib-utils', dependsOn: []},
				{key: 'lib-auth', dependsOn: ['lib-utils']},
				{key: 'lib-permissions', dependsOn: ['lib-utils']},
				{key: 'lib-api', dependsOn: ['lib-auth', 'lib-permissions']},
				{key: 'lib-storage', dependsOn: []},
				{key: 'lib-logging', dependsOn: ['lib-storage']},
				{key: 'admin-app', dependsOn: ['lib-api', 'lib-logging']},
				{key: 'user-app', dependsOn: ['lib-auth']},
				{key: 'public-app', dependsOn: ['lib-permissions']},
			],
			target: ['admin-app', 'public-app']
		},
		result: [
			'lib-storage', 'lib-utils',
			'lib-auth', 'lib-logging', 'lib-permissions',
			'lib-api',
			'admin-app', 'public-app'
		]
	}));

	it('filter with exclusion (admin-app only, excluding lib-logging)', runTestCase({
		input: {
			units: [
				{key: 'lib-utils', dependsOn: []},
				{key: 'lib-auth', dependsOn: ['lib-utils']},
				{key: 'lib-permissions', dependsOn: ['lib-utils']},
				{key: 'lib-api', dependsOn: ['lib-auth', 'lib-permissions']},
				{key: 'lib-storage', dependsOn: []},
				{key: 'lib-logging', dependsOn: ['lib-storage']},
				{key: 'admin-app', dependsOn: ['lib-api', 'lib-logging']},
				{key: 'user-app', dependsOn: ['lib-auth']},
				{key: 'public-app', dependsOn: ['lib-permissions']},
			],
			target: ['admin-app'],
			exclude: ['lib-logging']
		},
		result: [
			'lib-utils',
			'lib-auth', 'lib-permissions',
			'lib-api',
			'admin-app'
		]
	}));

	it('deep tree with shared mid-tier libs (target = frontend-app)', runTestCase({
			input: {
				units: [
					{key: 'core-utils', dependsOn: []},
					{key: 'env-config', dependsOn: ['core-utils']},
					{key: 'api-client', dependsOn: ['core-utils']},
					{key: 'auth-lib', dependsOn: ['env-config']},
					{key: 'data-processor', dependsOn: ['auth-lib', 'api-client']},
					{key: 'ui-components', dependsOn: ['core-utils']},
					{key: 'frontend-app', dependsOn: ['ui-components', 'api-client']},
					{key: 'backend-app', dependsOn: ['data-processor']},
				],
				target: ['frontend-app']
			},
			result: [
				'api-client',
				'core-utils',
				'frontend-app',
				'ui-components'
			]
		}
	));
});

