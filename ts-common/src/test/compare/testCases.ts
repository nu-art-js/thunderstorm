import {TestSuit_TS_Compare} from './types';
import {compare} from '../../main';


const TestCase_ts_compare: TestSuit_TS_Compare['testcases'] = [
	{
		description: 'compares same int',
		result: true,
		input: {
			one: 1,
			two: 1
		},
	},
	{
		description: 'compares same string number',
		result: true,
		input: {
			one: '1',
			two: '1'
		},
	},
	{
		description: 'compares different integers',
		result: false,
		input: {
			one: 1,
			two: 2
		}
	},
	{
		description: 'compares different integers',
		result: false,
		input: {
			one: 2,
			two: 1
		}
	},
	{
		description: 'compares same val with different type',
		result: false,
		input: {
			one: '1',
			two: 1
		}
	},
	{
		description: 'compares same val with different type',
		result: false,
		input: {
			one: 1,
			two: '1'
		}
	},
	{
		description: 'compares same string word',
		result: true,
		input: {
			one: 'test',
			two: 'test'
		}
	},
	{
		description: 'compares different string',
		result: false,
		input: {
			one: 'test1',
			two: 'test'
		}
	},
	{
		description: 'compares different string ',
		result: false,
		input: {
			one: 'test',
			two: 'test1'
		}
	},
	{
		description: 'empty arrays',
		result: true,
		input: {
			one: [],
			two: []
		}
	},
	{
		description: 'same array length 1',
		result: true,
		input: {
			one: ['Alon'],
			two: ['Alon']
		}
	},
	{
		description: 'same array length 2',
		result: true,
		input: {
			one: ['Alon', 'Ninio'],
			two: ['Alon', 'Ninio']
		}
	},
	{
		description: 'array and empty array',
		result: false,
		input: {
			one: ['Alon', 'Ninio'],
			two: []
		}
	},
	{
		description: 'empty array and array',
		result: false,
		input: {
			one: [],
			two: ['Alon', 'Ninio']
		}
	},
	{
		description: 'arrays with different length',
		result: false,
		input: {
			one: ['Alon', 'Ninio'],
			two: ['Alon']
		}
	},
	{
		description: 'arrays with different length',
		result: false,
		input: {
			one: ['Alon'],
			two: ['Alon', 'Ninio']
		}
	},
	{
		description: 'arrays with same elements in different places ',
		result: false,
		input: {
			one: ['Alon', 'Ninio'],
			two: ['Ninio', 'Alon']
		}
	},
	{
		description: 'Object with same 1 property ',
		result: true,
		input: {
			one: {a: 1},
			two: {a: 1}
		}
	},
	{
		description: 'Object with same 2 propertys ',
		result: true,
		input: {
			one: {a: 1, b: '2'},
			two: {a: 1, b: '2'}
		}
	},
	{
		description: 'null Objects',
		result: true,
		input: {
			one: null,
			two: null
		}
	},
	{
		description: 'null and object',
		result: false,
		input: {
			one: null,
			two: {a: 1}
		}
	},
	{
		description: 'null and undefined',
		result: false,
		input: {
			one: null,
			two: undefined
		}
	},
	{
		description: 'undefined and undefined',
		result: true,
		input: {
			one: undefined,
			two: undefined
		}
	}
];

export const TestSuit_ts_compare: TestSuit_TS_Compare = {
	label: 'Compare Test',
	testcases: TestCase_ts_compare,
	processor: (input) => compare(input.one, input.two)
};