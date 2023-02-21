import {expect} from 'chai';
import {removeFromArrayByIndex, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	index: number
}

const TestCase_removeFromArrayByIndex: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 2, 3],
		input: {
			array: [0, 1, 2, 3],
			index: 0
		}
	},
	{
		description: 'Test 2',
		result: [],
		input: {
			array: [0],
			index: 0
		}
	},
	{
		description: 'Test 3',
		result: [0],
		input: {
			array: [0],
			index: 1
		}
	},
	{
		description: 'Test 4',
		result: [1, 3],
		input: {
			array: [1, 2, 3],
			index: 1
		}
	},
	{
		description: 'Test 5',
		result: [],
		input: {
			array: [],
			index: 1
		}
	},
	{
		description: 'Test 6',
		result: [1, 2, 3],
		input: {
			array: [1, 2, 3],
			index: -21
		}
	},
	{
		description: 'Test 7',
		result: [{}, {}, {}],
		input: {
			array: [{}, {}, {}, {}],
			index: 2
		}
	},
];

export const TestSuite_removeFromArrayByIndex: TestSuite<Input, any> = {
	label: 'removeFromArrayByIndex',
	testcases: TestCase_removeFromArrayByIndex,
	processor: async (testCase) => {
		it(testCase.description, () => {
			const result = removeFromArrayByIndex(testCase.input.array, testCase.input.index);
			const expected = testCase.result;
			expect(result).to.eql(expected);
		});
	}
};