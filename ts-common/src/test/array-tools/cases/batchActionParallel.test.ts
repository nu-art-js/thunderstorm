import {batchActionParallel, runSingleTestCase, TestSuite} from '../../_main.js';

export type Input<T = any> = {
	array: T[];
	chunk: number;
	action: (item: T[]) => Promise<T[]>;
};

export type Result = any[];
export type TestSuite_batchActionParallel = TestSuite<Input, Result>;
export type TestCase_batchActionParallel = TestSuite_batchActionParallel['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	return batchActionParallel(input.array, input.chunk, input.action);
};

const runTestCase = (testCase: TestCase_batchActionParallel) => {
	return () => runSingleTestCase(test, testCase);
};

describe('batchActionParallel', () => {
	it('Multiplies numbers by 2 in parallel chunks of 2', runTestCase({
		input: {
			array: [1, 2, 3, 4, 5],
			chunk: 2,
			action: async (item) => item.map(x => x * 2)
		},
		result: [2, 4, 6, 8, 10]
	}));

	it('Replaces objects with null, preserves primitives in parallel', runTestCase({
		input: {
			array: [1, 2, 3, 4, 5, {}, {}, {}],
			chunk: 2,
			action: async (item) => item.map(x => typeof x === 'object' ? null : x)
		},
		result: [1, 2, 3, 4, 5, null, null, null]
	}));

	it('Sorts strings within each parallel chunk of size 2', runTestCase({
		input: {
			array: ['c', 'a', 'b', 'z'],
			chunk: 2,
			action: async (item) => item.sort()
		},
		result: ['a', 'c', 'b', 'z']
	}));

	it('Sorts first 3-element chunk, leaves final element untouched', runTestCase({
		input: {
			array: ['c', 'a', 'b', 'z'],
			chunk: 3,
			action: async (item) => item.sort()
		},
		result: ['a', 'b', 'c', 'z']
	}));
});
