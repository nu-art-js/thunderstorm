import {expect} from 'chai';
import {removeFromArray, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	item: (item: T) => boolean
}

const TestCase_removeFromArray: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 3],
		input: {
			array: [1, 2, 3],
			item: (item) => item % 2 === 0
		}
	},
	{
		description: 'Test 2',
		result: [4, 8, 10],
		input: {
			array: [4, 8, 10, 9],
			item: (item) => item % 2 === 1
		}
	},
	{
		description: 'Test 3',
		result: [{a: 1}, {a: 2}],
		input: {
			array: [{a: 1}, {a: 2}, {a: 3}],
			item: (item) => JSON.stringify(item) === JSON.stringify({a: 3})
		}
	},
	{
		description: 'Test 4',
		result: ['one', 'two'],
		input: {
			array: ['one', 'two', 'three'],
			item: (item) => item === 'three'
		}
	},
	{
		description: 'Test 5',
		result: [{a: 1}, {a: 2}, {b: 5, a: 3}],
		input: {
			array: [{a: 1}, {a: 2}, {b: 5, a: 3}],
			item: (item) => JSON.stringify(item) === JSON.stringify({a: 3, b: 5})
		}
	},
];

export const TestSuite_removeFromArray: TestSuite<Input, any> = {
	label: 'removeFromArray',
	testcases: TestCase_removeFromArray,
	processor: async (testCase) => {
		const result = removeFromArray(testCase.input.array, testCase.input.item);
		const expected = testCase.result;
		expect(result).to.eql(expected);
	}
};