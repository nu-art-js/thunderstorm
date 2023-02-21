import {expect} from 'chai';
import {merge, TestSuite} from '../../_main';
import {TestSuit_TS_Merge} from '../../merge/types';

type Input<T = any> = {
	one: any
	two: any
}

const TestCase_merge: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'merge two different non overlapping objects',
		result: {a: 1, b: 2},
		input: {
			one: {a: 1},
			two: {b: 2}
		},
	},
	{
		description: 'merge two different non overlapping objects',
		result: {a: 1, b: 2},
		input: {
			one: {b: 2},
			two: {a: 1}
		},
	},
	{
		description: 'merge two overlapping objects',
		result: {a: 2, b: 2},
		input: {
			one: {a: 1, b: 1},
			two: {a: 2, b: 2}
		},
	},
	{
		description: 'merge two overlapping objects',
		result: {a: 2, b: 1, c: 3},
		input: {
			one: {a: 2, b: undefined, c: 5},
			two: {b: 1, c: 3, d: null}
		},
	},
	{
		description: 'merge two overlapping objects',
		result: {a: 2, c: 5, d: null},
		input: {
			one: {b: 1, c: 3, d: null},
			two: {a: 2, b: undefined, c: 5}
		},
	},
	{
		description: 'merge two arrays',
		result: [],
		input: {
			one: [1, 2, 3, 4, 5],
			two: []
		},
	},
	{
		description: 'merge two arrays',
		result: [1, 2, 3, 4, 5],
		input: {
			one: [],
			two: [1, 2, 3, 4, 5]
		},
	},
	{
		description: 'merge two arrays',
		result: [1, 2, 3, 4, 5],
		input: {
			one: [7, 8],
			two: [1, 2, 3, 4, 5]
		},
	},
	{
		description: 'merge obj obj',
		result: {a: {a: {}}},
		input: {
			one: {a: {a: {}}},
			two: {a: {}}
		},
	},
	{
		description: 'merge two different non overlapping objects',
		result: {a: 0, b: 2},
		input: {
			one: {a: 0},
			two: {b: 2}
		},
	},
	{
		description: 'merge two different non overlapping objects',
		result: {a: '', b: ''},
		input: {
			one: {a: ''},
			two: {b: ''}
		},
	},
	{
		description: 'merge two different non overlapping objects',
		result: true,
		input: {
			one: true,
			two: true
		},
	},
	{
		description: 'merge two different non overlapping objects',
		result: false,
		input: {
			one: true,
			two: false
		},
	},
];

export const TestSuite_merge: TestSuite<Input, any> = {
	label: 'merge',
	testcases: TestCase_merge,
	processor: async (testCase) => {
		const result = merge(testCase.input.one, testCase.input.two);
		const expected = testCase.result;
		expect(result).to.eql(expected);
	}
};

const TestCase_mergeFail: TestSuit_TS_Merge['testcases'] = [
	{
		description: 'merge array with obj expected fail',
		result: 'Error',
		input: {
			one: [7, 8],
			two: {}
		},
	},
	{
		description: 'merge obj with array expected fail',
		result: 'Error',
		input: {
			one: {a: 2},
			two: [7, 8]
		},
	},
	{
		description: 'merge string with array expected fail',
		result: 'Error',
		input: {
			one: 'a',
			two: [7, 8]
		},
	},
	{
		description: 'merge string with array expected fail',//for some reason return undefined and not error
		result: 'Error',
		input: {
			one: '',
			two: [7, 8]
		},
	},
	{
		description: 'merge array with object',
		result: 'Error',
		input: {
			one: [7, 8],
			two: {a: [7, 8]}
		},
	},
	{
		description: 'merge int with object',
		result: 'Error',
		input: {
			one: 5,
			two: {a: 5}
		},
	},
	{
		description: 'merge obj with int',
		result: 'Error',
		input: {
			one: {a: 1},
			two: 1
		},
	},
	{
		description: 'merge string with int',
		result: 'Error',
		input: {
			one: 'one',
			two: 1
		},
	},
	{
		description: 'merge int with string',
		result: 'Error',
		input: {
			one: 1,
			two: 'one'
		},
	},
	{
		description: 'merge int with string',
		result: 'Error',
		input: {
			one: 0,
			two: 'one'
		},
	},
	{
		description: 'merge two different non overlapping objects',
		result: 'Error',
		input: {
			one: false,
			two: {b: ''}
		},
	},
];

export const TestSuite_mergeFail: TestSuite<Input, any> = {
	label: 'merge failure',
	testcases: TestCase_mergeFail,
	processor: async (testCase) => {
		expect(() => merge(testCase.input.one, testCase.input.two)).to.throw;
	}
};