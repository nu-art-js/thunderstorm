import {expect} from 'chai';
import {UnitDependentNode, UnitsDependencyMapper} from '../_common';
import {TestSuite} from '@nu-art/ts-common/testing/types';

export type Input = { units: UnitDependentNode[], target: string[], exclude?: string[] };
export type Result = string[];

export type TestSuite_UnitsDependencyFilter = TestSuite<Input, Result>;

const TestCase_UnitsDependencyFilter: TestSuite_UnitsDependencyFilter['testcases'] = [
	{
		description: 'filter for diamond graph (target = reports-service)',
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
	},
	{
		description: 'filter out one app from multi-app case',
		input: {
			units: [
				{key: 'shared-lib', dependsOn: []},
				{key: 'dashboard-app', dependsOn: ['shared-lib']},
				{key: 'monitor-app', dependsOn: ['shared-lib']},
			],
			target: ['dashboard-app']
		},
		result: ['shared-lib', 'dashboard-app']
	},
	{
		description: 'filter multi-app tree (admin-app + public-app)',
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
	},
	{
		description: 'filter with exclusion (admin-app only, excluding lib-logging)',
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
	},
	{
		description: 'deep tree with shared mid-tier libs (target = frontend-app)',
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
];

const test = async (input: Input): Promise<Result> => {
	const filter = new UnitsDependencyMapper(input.units);
	const pruned = filter.filterForTargets(input.target, input.exclude);
	return pruned.map(unit => unit.key).sort();
};

export const Tests_UnitsDependencyFilter: TestSuite_UnitsDependencyFilter = {
	label: 'UnitsDependencyFilter',
	testcases: TestCase_UnitsDependencyFilter,
	processor: async (testCase) => {
		const input = testCase.input;

		if ('error' in testCase) {
			await expect(test(input)).to.be.rejectedWith(testCase.error.expected, testCase.error.message);
			return;
		}

		const output = await test(input);
		expect(output).to.deep.equal(testCase.result.sort());
	}
};
