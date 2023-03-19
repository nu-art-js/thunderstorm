import {expect} from 'chai';
import {findDuplicates, TestSuite} from '../../_main';

type Input<T = any> = {
	array1: T[]
	array2: T[]
}
const emptyObj = {};

const TestCase_findDuplicates: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 2, 3],
		input: {
			array1: [1, 2, 3],
			array2: [1, 2, 3, 4]
		}
	},
	{
		description: 'Test 2',
		result: [emptyObj],
		input: {
			array1: [emptyObj],
			array2: [emptyObj]
		}
	},
	{
		description: 'Test 3',
		result: [1, 2, 3, 4, 5],
		input: {
			array1: [1, 2, 3, 4, 5],
			array2: [5, 4, 3, 2, 1]
		}
	},
	{
		description: 'Test 4',
		result: [1, 5, 1],
		input: {
			array1: [1, 2, 3, 4, 5, 1],
			array2: [5, 1]
		}
	},
	{
		description: 'Test 5',
		result: [5, 1, 5],
		input: {
			array1: [5, 1, 5],
			array2: [5, 1, 1, 1, 1]
		}
	},
	{
		description: 'Test 6',
		result: [],
		input: {
			array1: [1, 'a',],
			array2: [2, 3, 'b']
		}
	},
	{
		description: 'Test 7',
		result: [1, 1, 1, 1, 1, 1, 1, 1, 1],
		input: {
			array1: [1, 1, 1, 1, 1, 1, 1, 1, 1],
			array2: [1]
		}
	}
];

export const TestSuite_findDuplicates: TestSuite<Input, any> = {
	label: 'findDuplicates',
	testcases: TestCase_findDuplicates,
	processor: async (testCase) => {
		const result = findDuplicates(testCase.input.array1, testCase.input.array2);
		const expected = testCase.result;
		expect(result).to.deep.equals(expected);
	}
};