import {expect} from 'chai';
import {UnitDependentNode, UnitsDependencyMapper} from '../_common';
import {TestSuite} from '@nu-art/ts-common/testing/types';

export type Input = UnitDependentNode[];
export type Result = string[][];

export type TestSuite_UnitsDependencyMapper = TestSuite<Input, Result>;

const TestCase_UnitsDependencyMapper: TestSuite_UnitsDependencyMapper['testcases'] = [
	{
		description: 'linear chain',
		input: [
			{key: 'source', dependsOn: []},
			{key: 'processor', dependsOn: ['source']},
			{key: 'consumer', dependsOn: ['processor']},
		],
		result: [['source'], ['processor'], ['consumer']],
	},
	{
		description: 'fan-in',
		input: [
			{key: 'aggregator', dependsOn: ['reader-a', 'reader-b']},
			{key: 'reader-a', dependsOn: []},
			{key: 'reader-b', dependsOn: []},
		],
		result: [['reader-a', 'reader-b'], ['aggregator']],
	},
	{
		description: 'fan-out',
		input: [
			{key: 'config', dependsOn: []},
			{key: 'service-a', dependsOn: ['config']},
			{key: 'service-b', dependsOn: ['config']},
		],
		result: [['config'], ['service-a', 'service-b']],
	},
	{
		description: 'cyclic should throw',
		input: [
			{key: 'loop-a', dependsOn: ['loop-b']},
			{key: 'loop-b', dependsOn: ['loop-a']},
		],
		error: {expected: /Cyclic/},
	},
	{
		description: 'fanout with shared child',
		input: [
			{key: 'logger', dependsOn: ['utils']},
			{key: 'utils', dependsOn: []},
			{key: 'controller', dependsOn: ['parser', 'logger']},
			{key: 'parser', dependsOn: ['utils']},
		],
		result: [['utils'], ['logger', 'parser'], ['controller']],
	},
	{
		description: 'completely flat graph',
		input: [
			{key: 'module-a', dependsOn: []},
			{key: 'module-b', dependsOn: []},
			{key: 'module-c', dependsOn: []},
			{key: 'module-d', dependsOn: []},
		],
		result: [['module-a', 'module-b', 'module-c', 'module-d']],
	},
	{
		description: 'deep linear chain',
		input: [
			{key: 'step-1', dependsOn: []},
			{key: 'step-2', dependsOn: ['step-1']},
			{key: 'step-3', dependsOn: ['step-2']},
			{key: 'step-4', dependsOn: ['step-3']},
			{key: 'step-5', dependsOn: ['step-4']},
		],
		result: [['step-1'], ['step-2'], ['step-3'], ['step-4'], ['step-5']],
	},
	{
		description: 'disconnected subgraphs',
		input: [
			{key: 'analytics-core', dependsOn: []},
			{key: 'reporting-engine', dependsOn: ['analytics-core']},
			{key: 'image-loader', dependsOn: []},
			{key: 'preview-module', dependsOn: ['image-loader']},
		],
		result: [['analytics-core', 'image-loader'], ['preview-module', 'reporting-engine']],
	},
	{
		description: 'multiple roots and endpoints',
		input: [
			{key: 'config-a', dependsOn: []},
			{key: 'service-a', dependsOn: ['config-a']},
			{key: 'config-b', dependsOn: []},
			{key: 'service-b', dependsOn: ['config-b']},
			{key: 'gateway', dependsOn: ['service-a', 'service-b']},
			{key: 'frontend', dependsOn: ['gateway']},
		],
		result: [['config-a', 'config-b'], ['service-a', 'service-b'], ['gateway'], ['frontend']],
	},
	{
		description: 'diamond dependency graph',
		input: [
			{key: 'foundation', dependsOn: []},
			{key: 'lib-a', dependsOn: ['foundation']},
			{key: 'lib-b', dependsOn: ['foundation']},
			{key: 'api-layer', dependsOn: ['lib-a', 'lib-b']},
		],
		result: [['foundation'], ['lib-a', 'lib-b'], ['api-layer']],
	},
	{
		description: 'Complex case with 3 apps and 30+ libs with various dependency shapes',
		input: [
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
		result: [
			['lib-storage', 'lib-utils'],
			['lib-auth', 'lib-logging', 'lib-permissions'],
			['lib-api'],
			['admin-app', 'public-app', 'user-app']
		]
	}
];

const test = async (input: Input): Promise<Result> => {
	const unitsDependencyMapper = new UnitsDependencyMapper(input);
	const buildDependencyTree = unitsDependencyMapper.buildDependencyTree();
	unitsDependencyMapper.printGraph();
	return buildDependencyTree;
};

export const Tests_UnitsDependencyMapper: TestSuite_UnitsDependencyMapper = {
	label: 'UnitsDependencyMapper',
	testcases: TestCase_UnitsDependencyMapper,
	processor: async (testCase) => {
		const input = testCase.input;

		if ('error' in testCase) {
			await expect(test(input)).to.be.rejectedWith(testCase.error.expected, testCase.error.message);
			return;
		}

		const output = await test(input);
		expect(output).to.deep.equal(testCase.result);
	}
};
