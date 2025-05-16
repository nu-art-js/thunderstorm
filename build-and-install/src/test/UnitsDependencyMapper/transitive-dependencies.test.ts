import {UnitDependentNode, UnitsDependencyMapper} from '../_common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';

export type Input = { units: UnitDependentNode[], target: string };
export type Result = string[];

export type TestSuite_GetTransitiveDependencies = TestSuite<Input, Result>;
export type TestCase_GetTransitiveDependencies = TestSuite_GetTransitiveDependencies['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	const mapper = new UnitsDependencyMapper(input.units);
	return mapper.getTransitiveDependencies([input.target]).sort();
};

const runTestCase = (testCase: TestCase_GetTransitiveDependencies, processor?: typeof defaultTestProcessor) => () => {
	if ('result' in testCase)
		testCase.result = testCase.result.sort();
	return runSingleTestCase(test, testCase, processor);
};

describe('UnitsDependencyMapper.getTransitiveDependencies', () => {
	it('should resolve all direct and indirect dependencies', runTestCase({
		input: {
			units: [
				{key: 'core-utils', dependsOn: []},
				{key: 'env-config', dependsOn: ['core-utils']},
				{key: 'auth-lib', dependsOn: ['env-config']},
				{key: 'data-layer', dependsOn: ['auth-lib']},
				{key: 'frontend-app', dependsOn: ['data-layer']},
			],
			target: 'frontend-app'
		},
		result: ['core-utils', 'env-config', 'auth-lib', 'data-layer']
	}));

	it('should return empty if unit has no dependencies', runTestCase({
		input: {
			units: [
				{key: 'base-lib', dependsOn: []},
				{key: 'standalone-app', dependsOn: []}
			],
			target: 'standalone-app'
		},
		result: []
	}));

	it('should throw if target does not exist', runTestCase({
		input: {
			units: [
				{key: 'x', dependsOn: []}
			],
			target: 'ghost-lib'
		},
		error: {
			expected: 'Unit \'ghost-lib\' not found',
		}
	}));

	it('diamond graph dependencies (target = d)', runTestCase({
		input: {
			units: [
				{key: 'a', dependsOn: []},
				{key: 'b', dependsOn: ['a']},
				{key: 'c', dependsOn: ['a']},
				{key: 'd', dependsOn: ['b', 'c']},
			],
			target: 'd'
		},
		result: ['a', 'b', 'c']
	}));

	it('disconnected subgraphs (target = c)', runTestCase({
		input: {
			units: [
				{key: 'a', dependsOn: ['b']},
				{key: 'b', dependsOn: []},
				{key: 'c', dependsOn: ['d']},
				{key: 'd', dependsOn: []},
			],
			target: 'c'
		},
		result: ['d']
	}));
});
