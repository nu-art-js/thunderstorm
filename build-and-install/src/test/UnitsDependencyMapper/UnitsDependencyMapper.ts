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
			{key: 'a', dependsOn: []},
			{key: 'b', dependsOn: ['a']},
			{key: 'c', dependsOn: ['b']},
		],
		result: [['a'], ['b'], ['c']],
	},
	{
		description: 'fan-in',
		input: [
			{key: 'c', dependsOn: ['a', 'b']},
			{key: 'a', dependsOn: []},
			{key: 'b', dependsOn: []},
		],
		result: [['a', 'b'], ['c']],
	},
	{
		description: 'fan-out',
		input: [
			{key: 'a', dependsOn: []},
			{key: 'b', dependsOn: ['a']},
			{key: 'c', dependsOn: ['a']},
		],
		result: [['a'], ['b', 'c']],
	},
	{
		description: 'cyclic should throw',
		input: [
			{key: 'a', dependsOn: ['b']},
			{key: 'b', dependsOn: ['a']},
		],
		error: {expected: /Cyclic/}, // will assert error instead
	},
	{
		description: 'fanout with shared child',
		input: [
			{key: 'c', dependsOn: ['a']},
			{key: 'a', dependsOn: []},
			{key: 'd', dependsOn: ['b', 'c']},
			{key: 'b', dependsOn: ['a']},
		],
		result: [['a'], ['b', 'c'], ['d']],
	},
	{
		description: 'completely flat graph',
		input: [
			{key: 'a', dependsOn: []},
			{key: 'b', dependsOn: []},
			{key: 'c', dependsOn: []},
			{key: 'd', dependsOn: []},
		],
		result: [['a', 'b', 'c', 'd']],
	},
	{
		description: 'deep linear chain',
		input: [
			{key: 'a', dependsOn: []},
			{key: 'b', dependsOn: ['a']},
			{key: 'c', dependsOn: ['b']},
			{key: 'd', dependsOn: ['c']},
			{key: 'e', dependsOn: ['d']},
		],
		result: [['a'], ['b'], ['c'], ['d'], ['e']],
	},
	{
		description: 'disconnected subgraphs',
		input: [
			{key: 'a', dependsOn: []},
			{key: 'b', dependsOn: ['a']},
			{key: 'x', dependsOn: []},
			{key: 'y', dependsOn: ['x']},
		],
		result: [['a', 'x'], ['b', 'y']],
	},
	{
		description: 'multiple roots and endpoints',
		input: [
			{key: 'a', dependsOn: []},
			{key: 'b', dependsOn: ['a']},
			{key: 'e', dependsOn: []},
			{key: 'f', dependsOn: ['e']},
			{key: 'c', dependsOn: ['b', 'f']},
			{key: 'd', dependsOn: ['c']},
		],
		result: [['a', 'e'], ['b', 'f'], ['c'], ['d']],
	},
	{
		description: 'diamond dependency graph',
		input: [
			{key: 'a', dependsOn: []},
			{key: 'b', dependsOn: ['a']},
			{key: 'c', dependsOn: ['a']},
			{key: 'd', dependsOn: ['b', 'c']},
		],
		result: [['a'], ['b', 'c'], ['d']],
	}, {
		description: 'Complex case with 3 apps and 30+ libs with various dependency shapes',
		input: [
			// Base libs
			{key: 'lib-utils', dependsOn: []},
			{key: 'lib-auth', dependsOn: ['lib-utils']},
			{key: 'lib-permissions', dependsOn: ['lib-utils']},
			{key: 'lib-api', dependsOn: ['lib-auth', 'lib-permissions']},
			{key: 'lib-storage', dependsOn: []},
			{key: 'lib-logging', dependsOn: ['lib-storage']},

			// Apps depend on libs
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
		// output intentionally left out since it's large — can be verified via printGraph or buildDependencyTree in tests
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