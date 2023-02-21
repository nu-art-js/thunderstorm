import {expect} from 'chai';
import {filterAsync, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	filter: (item: T) => Promise<boolean>
}

const TestCase_filterAsync: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [2, 4, 6],
		input: {
			array: [1, 2, 3, 4, 5, 6, 7],
			filter: async (n: number) => n % 2 === 0
		}
	},
	{
		description: 'Test 2',
		result: [3, 4, 5, 6, 7],
		input: {
			array: ['1', '{}', 3, 4, 5, 6, 7],
			filter: async (n: any) => typeof n !== 'string'
		}
	},
	{
		description: 'Test 3',
		result: [{}, {a: 5}, {b: 5}],
		input: {
			array: [1, 2, {}, {a: 5}, {b: 5}],
			filter: async (n: any) => typeof n === 'object'
		}
	},
	{
		description: 'Test 4',
		result: ['one', 5,],
		input: {
			array: ['one', {a: 3}, 5, {}],
			filter: async (item: any) => typeof item !== 'object'
		}
	},
];

export const TestSuite_filterAsync: TestSuite<Input, any> = {
	label: 'filterAsync',
	testcases: TestCase_filterAsync,
	processor: async (testCase) => {
		const result = filterAsync(testCase.input.array, testCase.input.filter);
		const expected = testCase.result;
		expect(await result).to.deep.equals(await expected);
	}
};