import {batchAction, generateArray, runSingleTestCase, TestSuite} from '../../_main.js';

export type Input<T = any> = {
	array: T[];
	chunk: number;
	action: (item: T[]) => Promise<T[]>;
};

export type Result = any[];
export type TestSuite_batchAction = TestSuite<Input, Result>;
export type TestCase_batchAction = TestSuite_batchAction['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	return batchAction(input.array, input.chunk, input.action);
};

const runTestCase = (testCase: TestCase_batchAction) => {
	return () => runSingleTestCase(test, testCase);
};

describe('batchAction', () => {
	it('Multiplies numbers in chunks of 2 by 3', runTestCase({
		input: {
			array: [1, 2, 3, 4, 5],
			chunk: 2,
			action: async (item) => item.map(x => x * 3)
		},
		result: [3, 6, 9, 12, 15]
	}));

	it('Converts non-object to null and preserves objects', runTestCase({
		input: {
			array: [5, {}, {}, {}],
			chunk: 2,
			action: async (item) => item.map(x => typeof x !== 'object' ? null : x)
		},
		result: [null, {}, {}, {}]
	}));

	it('Squares numbers in chunks of 2', runTestCase({
		input: {
			array: [1, 2, 3, 4, 5],
			chunk: 2,
			action: async (item) => item.map(x => x * x)
		},
		result: [1, 4, 9, 16, 25]
	}));

	it('Sorts two chunks independently - chunk 2', runTestCase({
		input: {
			array: ['c', 'a', 'b', 'z'],
			chunk: 2,
			action: async (item) => item.sort()
		},
		result: ['a', 'c', 'b', 'z']
	}));

	it('Sorts first chunk of 3, last chunk remains - chunk 3', runTestCase({
		input: {
			array: ['c', 'a', 'b', 'z'],
			chunk: 3,
			action: async (item) => item.sort()
		},
		result: ['a', 'b', 'c', 'z']
	}));

	it('Returns identity for array of 100 strings with chunk of 10', runTestCase({
		input: {
			array: generateArray(100),
			chunk: 10,
			action: async (item) => item
		},
		result: generateArray(100)
	}));
});