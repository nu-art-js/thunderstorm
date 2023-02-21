import {expect} from 'chai';
import {removeItemFromArray, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	item: any
}

const emptyObj = {};
const obj1 = {b: 2, a: 3};
const obj2 = {a: 2, b: 3};
const TestCase_removeItemFromArray: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 2, 3],
		input: {
			array: [1, 2, 3],
			item: 0
		}
	},
	{
		description: 'Test 2',
		result: [1, 3],
		input: {
			array: [1, 2, 3],
			item: 2
		}
	},
	{
		description: 'Test 3',
		result: [2, 3, 1],
		input: {
			array: [1, 2, 3, 1],
			item: 1
		}
	},
	{
		description: 'Test 4',
		result: [{}, {}],
		input: {
			array: [emptyObj, {}, {}],
			item: emptyObj
		}
	},
	{
		description: 'Test 5',
		result: [{a: 2}, {a: 2}, {a: 2}],
		input: {
			array: [{a: 2}, {a: 2}, {a: 2}],
			item: 2
		}
	},
	{
		description: 'Test 6',
		result: [{a: 3}, 'b', 'a', {}],
		input: {
			array: [{a: 3}, 'b', 'a', {}],
			item: '{}'
		}
	},
	{
		description: 'Test 7',
		result: [{a: 3}, {a: 2}, {a: {b: 3}}, {}],
		input: {
			array: [{a: 3}, {a: 2}, {a: {b: 3}}, {}],
			item: {b: 3}
		}
	},
	{
		description: 'Test 8',
		result: [{a: 3}, {a: 2}, {a: {b: 3}}, {}],
		input: {
			array: [{a: 3}, {a: 2}, {a: {b: 3}}, {}],
			item: {a: 3}
		}
	},
	{
		description: 'Test 9',
		result: ['b', 'c'],
		input: {
			array: ['a', 'b', 'c'],
			item: 'a'
		}
	},
	{
		description: 'Test 10',
		result: [{a: 4, b: 5}],
		input: {
			array: [obj2, {a: 4, b: 5}],
			item: obj2
		}
	},
	{
		description: 'Test 11',
		result: [{b: 5, a: 4}],
		input: {
			array: [obj1, {a: 4, b: 5}],
			item: obj1
		}
	},
];

export const TestSuite_removeItemFromArray: TestSuite<Input, any> = {
	label: 'removeItemFromArray',
	testcases: TestCase_removeItemFromArray,
	processor: async (testCase) => {
		it(testCase.description, () => {
			const result = removeItemFromArray(testCase.input.array, testCase.input.item);
			const expected = testCase.result;
			expect(result).to.eql(expected);
		});
	}
};