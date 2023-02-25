import {expect} from 'chai';
import {batchActionParallel, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	chunk: number
	action: (item: T[]) => Promise<T[]>
}

const TestCase_batchActionParallel: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: Promise.resolve([2, 4, 6, 8, 10]),
		input: {
			array: [1, 2, 3, 4, 5],
			chunk: 2,
			action: async (item: number[]) => {
				return item.map(x => x * 2);
			}
		}
	},
	{
		description: 'Test 2',
		result: Promise.resolve([1, 2, 3, 4, 5, null, null, null]),
		input: {
			array: [1, 2, 3, 4, 5, {}, {}, {}],
			chunk: 2,
			action: async (item: number[]) => {
				return item.map(x => {
					if (typeof x === 'object')
						return null;
					return x;
				});
			}
		}
	},
	{
		description: 'Test 3',
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
		description: 'Test 4',
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

export const TestSuite_batchActionParallel: TestSuite<Input, any> = {
	label: 'batchActionParallel',
	testcases: TestCase_batchActionParallel,
	processor: async (testCase) => {
		const result = batchActionParallel(testCase.input.array, testCase.input.chunk, testCase.input.action);
		const expected = testCase.result;
		expect(await result).to.deep.equals(await expected);
	}
};