import {expect} from 'chai';
import {batchAction, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	chunk: number
	action: (item: T[]) => Promise<T[]>
}

const TestCase_batchAction: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: Promise.resolve([3, 6, 9, 12, 15]),
		input: {
			array: [1, 2, 3, 4, 5],
			chunk: 2,
			action: async (item: number[]) => {
				return item.map(x => x * 3);
			}
		}
	},
	{
		description: 'Test 2',
		result: Promise.resolve([null, {}, {}, {}]),
		input: {
			array: [5, {}, {}, {}],
			chunk: 2,
			action: async (item: number[]) => {
				return item.map(x => {
					if (typeof x !== 'object')
						return null;
					return x;
				});
			}
		}
	},
	{
		description: 'Test 3',
		result: Promise.resolve([1, 4, 9, 16, 25]),
		input: {
			array: [1, 2, 3, 4, 5],
			chunk: 2,
			action: async (item: number[]) => {
				return item.map(x => x * x);
			}
		}
	},
	{
		description: 'Test 4',
		result: Promise.resolve(['a', 'c', 'b', 'z']),
		input: {
			array: ['c', 'a', 'b', 'z'],
			chunk: 2,
			action: async (item: string[]) => {
				return item.sort();
			}
		}
	},
	{
		description: 'Test 5',
		result: Promise.resolve(['a', 'b', 'c', 'z']),
		input: {
			array: ['c', 'a', 'b', 'z'],
			chunk: 3,
			action: async (item: string[]) => {
				return item.sort();
			}
		}
	},
];

export const TestSuite_batchAction: TestSuite<Input, any> = {
	label: 'batchAction',
	testcases: TestCase_batchAction,
	processor: async (testCase) => {
		const result = batchAction(testCase.input.array, testCase.input.chunk, testCase.input.action);
		const expected = testCase.result;
		expect(await result).to.deep.equals(await expected);
	}
};