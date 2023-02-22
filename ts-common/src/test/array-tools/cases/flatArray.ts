import {expect} from 'chai';
import {flatArray, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	result: T[]
}
const emptyObj = {};

const TestCase_flatArray: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 2, 3, 5, 6, 7],
		input: {
			array: [[1, 2, 3], [5, 6, 7]],
			result: []
		}
	},
];

export const TestSuite_flatArray: TestSuite<Input, any> = {
	label: 'flatArray',
	testcases: TestCase_flatArray,
	processor: async (testCase) => {
		const result = flatArray(testCase.input.array, testCase.input.result);
		const expected = testCase.result;
		expect(result).to.deep.equals(expected);
	}
};