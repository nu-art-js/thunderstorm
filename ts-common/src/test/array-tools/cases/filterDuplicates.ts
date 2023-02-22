import {expect} from 'chai';
import {filterDuplicates, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	mapper?: (item: T) => any
}

const TestCase_filterDuplicates: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 2, 3],
		input: {
			array: [1, 2, 3],
			mapper: undefined
		}
	},
	{
		description: 'Test 2',
		result: [1, 2, 3],
		input: {
			array: [1, 2, 3, 3],
			mapper: undefined
		}
	},
	{
		description: 'Test 3',
		result: [1, 2, 'abc'],
		input: {
			array: [1, 2, 'abc', 'abc'],
			mapper: undefined //don't fully understand how to create mapper
		}
	},
	{
		description: 'Test 4',
		result: [1, 2, {}, {}],
		input: {
			array: [1, 2, {}, {}],
			mapper: undefined
		}
	},
	{
		description: 'Test 5',
		result: [{a: 2}, {a: {b: 3}}, {a: 3, b: 2}],
		input: {
			array: [{a: 2}, {a: 2, b: 2}, {a: {b: 3}}, {a: 3, b: 2}],
			mapper: (item) => item.a
		}
	},
];

export const TestSuite_filterDuplicates: TestSuite<Input, any> = {
	label: 'filterDuplicates',
	testcases: TestCase_filterDuplicates,
	processor: async (testCase) => {
		const result = filterDuplicates(testCase.input.array, testCase.input.mapper);
		const expected = testCase.result;
		expect(result).to.deep.equals(expected);
	}
};