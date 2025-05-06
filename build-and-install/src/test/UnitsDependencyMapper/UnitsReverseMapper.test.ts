// New canvas: Reverse filter
// Motivation: From a changed lib, find all apps (and intermediate libs) that depend on it

import {expect} from 'chai';
import {UnitDependentNode, UnitsDependencyMapper} from '../_common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';

export type ReverseFilterInput = { units: UnitDependentNode[], changed: string[] };
export type ReverseFilterResult = string[];

export type TestSuite_UnitsReverseDependency = TestSuite<ReverseFilterInput, ReverseFilterResult>;

const TestCase_UnitsReverseDependency: TestSuite_UnitsReverseDependency['testcases'] = [
	{
		description: 'single leaf change (lib-auth)',
		input: {
			units: [
				{key: 'lib-utils', dependsOn: []},
				{key: 'lib-auth', dependsOn: ['lib-utils']},
				{key: 'lib-api', dependsOn: ['lib-auth']},
				{key: 'admin-app', dependsOn: ['lib-api']},
			],
			changed: ['lib-auth']
		},
		result: ['lib-auth', 'lib-api', 'admin-app']
	},
	{
		description: 'mid graph change (lib-utils)',
		input: {
			units: [
				{key: 'lib-utils', dependsOn: []},
				{key: 'lib-auth', dependsOn: ['lib-utils']},
				{key: 'lib-api', dependsOn: ['lib-auth']},
				{key: 'public-app', dependsOn: ['lib-api']},
				{key: 'admin-app', dependsOn: ['lib-auth']},
			],
			changed: ['lib-utils']
		},
		result: ['lib-utils', 'lib-auth', 'lib-api', 'admin-app', 'public-app']
	},
	{
		description: 'multiple changed nodes (lib-auth and lib-api)',
		input: {
			units: [
				{key: 'lib-core', dependsOn: []},
				{key: 'lib-auth', dependsOn: ['lib-core']},
				{key: 'lib-api', dependsOn: ['lib-core']},
				{key: 'integration-service', dependsOn: ['lib-auth', 'lib-api']},
				{key: 'gateway-app', dependsOn: ['integration-service']},
			],
			changed: ['lib-auth', 'lib-api']
		},
		result: ['lib-auth', 'lib-api', 'integration-service', 'gateway-app']
	},
	{
		description: 'changed lib not referenced anywhere',
		input: {
			units: [
				{key: 'lib-unused', dependsOn: []},
				{key: 'user-app', dependsOn: []},
			],
			changed: ['lib-unused']
		},
		result: ['lib-unused']
	},
	{
		description: 'deep nested chain (change = core-utils)',
		input: {
			units: [
				{key: 'core-utils', dependsOn: []},
				{key: 'env-config', dependsOn: ['core-utils']},
				{key: 'auth-lib', dependsOn: ['env-config']},
				{key: 'data-layer', dependsOn: ['auth-lib']},
				{key: 'frontend-app', dependsOn: ['data-layer']},
			],
			changed: ['core-utils']
		},
		result: ['core-utils', 'env-config', 'auth-lib', 'data-layer', 'frontend-app']
	},
	{
		description: 'change propagates through shared lib to multiple apps',
		input: {
			units: [
				{key: 'core-utils', dependsOn: []},
				{key: 'shared-lib', dependsOn: ['core-utils']},
				{key: 'admin-ui', dependsOn: ['shared-lib']},
				{key: 'user-ui', dependsOn: ['shared-lib']},
				{key: 'user-service', dependsOn: ['shared-lib']},
			],
			changed: ['core-utils']
		},
		result: ['core-utils', 'shared-lib', 'admin-ui', 'user-ui', 'user-service']
	},
	{
		description: 'isolated subgraphs with targeted change',
		input: {
			units: [
				{key: 'auth-core', dependsOn: []},
				{key: 'auth-service', dependsOn: ['auth-core']},
				{key: 'billing-core', dependsOn: []},
				{key: 'billing-service', dependsOn: ['billing-core']},
				{key: 'billing-app', dependsOn: ['billing-service']},
			],
			changed: ['auth-core']
		},
		result: ['auth-core', 'auth-service']
	},
	{
		description: 'fan-out to many services from one shared lib',
		input: {
			units: [
				{key: 'shared-logger', dependsOn: []},
				{key: 'auth-service', dependsOn: ['shared-logger']},
				{key: 'payment-service', dependsOn: ['shared-logger']},
				{key: 'notification-service', dependsOn: ['shared-logger']},
				{key: 'dashboard-app', dependsOn: ['auth-service', 'payment-service']},
			],
			changed: ['shared-logger']
		},
		result: ['shared-logger', 'auth-service', 'payment-service', 'notification-service', 'dashboard-app']
	},
	{
		description: 'changed node not found in graph',
		input: {
			units: [
				{key: 'app-a', dependsOn: []},
				{key: 'app-b', dependsOn: ['app-a']},
			],
			changed: ['non-existent-lib']
		},
		error: {
			expected: 'Unknown unit: non-existent-lib',
		}
	},
	{
		description: 'changed node filtered out by structure (no downstream)',
		input: {
			units: [
				{key: 'app-x', dependsOn: []},
				{key: 'lib-unused', dependsOn: []},
			],
			changed: ['lib-unused']
		},
		result: ['lib-unused']
	},
	{
		description: 'changed node partially matches graph (only one found)',
		input: {
			units: [
				{key: 'lib-core', dependsOn: []},
				{key: 'feature-lib', dependsOn: ['lib-core']},
				{key: 'feature-app', dependsOn: ['feature-lib']},
			],
			changed: ['lib-core', 'ghost-lib']
		},
		error: {
			expected: 'Unknown unit: ghost-lib',
		}
	},
	{
		description: 'all changed nodes are valid but disconnected',
		input: {
			units: [
				{key: 'core-a', dependsOn: []},
				{key: 'core-b', dependsOn: []},
				{key: 'app-a', dependsOn: ['core-a']},
				{key: 'app-b', dependsOn: ['core-b']},
			],
			changed: ['core-a', 'core-b']
		},
		result: ['core-a', 'core-b', 'app-a', 'app-b']
	}
];


const test = async (input: ReverseFilterInput): Promise<ReverseFilterResult> => {
	const mapper = new UnitsDependencyMapper(input.units);
	const result = mapper.getReverseDependencies(input.changed);
	return result.map(unit => unit.key).sort();
};

export const Tests_UnitsReverseDependency: TestSuite_UnitsReverseDependency = {
	label: 'UnitsReverseDependency',
	testcases: TestCase_UnitsReverseDependency,
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

describe('UnitsReverseDependency', () => {
	testSuiteTester(Tests_UnitsReverseDependency);
});

