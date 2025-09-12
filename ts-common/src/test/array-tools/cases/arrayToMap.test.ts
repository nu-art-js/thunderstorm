import {arrayToMap, runSingleTestCase, TestSuite} from '../../_main.js';

export type Input<T = any> = {
	array: T[];
	getKey: (item: T, index: number, map: { [k: string]: T }) => string | number;
	map?: { [k: string]: T };
};

export type Result = { [k: string]: any };
export type TestSuite_arrayToMap = TestSuite<Input, Result>;
export type TestCase_arrayToMap = TestSuite_arrayToMap['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	return arrayToMap(input.array, input.getKey, input.map ?? {});
};

const runTestCase = (testCase: TestCase_arrayToMap) => {
	return () => runSingleTestCase(test, testCase);
};

describe('arrayToMap', () => {
	it('Number array to map', runTestCase({
		input: {
			array: [1, 2, 3],
			getKey: (item, index) => index,
		},
		result: {0: 1, 1: 2, 2: 3}
	}));

	it('String array to map', runTestCase({
		input: {
			array: ['zero', 'one', 'two'],
			getKey: (item, index) => index,
		},
		result: {0: 'zero', 1: 'one', 2: 'two'}
	}));
});
