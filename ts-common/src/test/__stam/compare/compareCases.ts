import {TestModel_Compare, TestSuitV2} from '../types';


const TestCase_ts_compare: TestModel_Compare[] = [
	{
		description: 'compares same int',
		answer: true,
		input: {
			one: 1,
			two: 1
		},
	},
	{
		description: 'compares same string number',
		answer: true,
		input: {
			one: '1',
			two: '1'
		},
	},
	{
		description: 'compares different integers',
		answer: false,
		input: {
			one: 1,
			two: 2
		}
	},
	{
		description: 'compares different integers',
		answer: false,
		input: {
			one: 2,
			two: 1
		}
	},
	{
		description: 'compares same val with different type',
		answer: false,
		input: {
			one: '1',
			two: 1
		}
	},
	{
		description: 'compares same val with different type',
		answer: false,
		input: {
			one: 1,
			two: '1'
		}
	},
	{
		description: 'compares same string word',
		answer: true,
		input: {
			one: 'test',
			two: 'test'
		}
	},
	{
		description: 'compares different string',
		answer: false,
		input: {
			one: 'test1',
			two: 'test'
		}
	},
	{
		description: 'compares different string ',
		answer: false,
		input: {
			one: 'test',
			two: 'test1'
		}
	},
	{
		description: 'empty arrays',
		answer: true,
		input: {
			one: [],
			two: []
		}
	},
	{
		description: 'same array length 1',
		answer: true,
		input: {
			one: ["Alon"],
			two: ["Alon"]
		}
	},
	{
		description: 'same array length 2',
		answer: true,
		input: {
			one: ["Alon","Ninio"],
			two: ["Alon","Ninio"]
		}
	},
	{
		description: 'array and empty array',
		answer: false,
		input: {
			one: ["Alon","Ninio"],
			two: []
		}
	},
	{
		description: 'empty array and array',
		answer: false,
		input: {
			one: [],
			two: ["Alon","Ninio"]
		}
	},
	{
		description: 'arrays with different length',
		answer: false,
		input: {
			one: ["Alon","Ninio"],
			two: ["Alon"]
		}
	},
	{
		description: 'arrays with different length',
		answer: false,
		input: {
			one: ["Alon"],
			two: ["Alon","Ninio"]
		}
	},
	{
		description: 'arrays with same elements in different places ',
		answer: false,
		input: {
			one: ["Alon","Ninio"],
			two: ["Ninio","Alon"]
		}
	},
	{
		description: 'Object with same 1 property ',
		answer: true,
		input: {
			one: {a: 1},
			two: {a: 1}
		}
	},
	{
		description: 'Object with same 2 propertys ',
		answer: true,
		input: {
			one: {a: 1, b: "2"},
			two: {a: 1, b: "2"}
		}
	},
	{
		description: 'null Objects',
		answer: true,
		input: {
			one: null,
			two: null
		}
	},
	{
		description: 'null and object',
		answer: false,
		input: {
			one: null,
			two: {a: 1}
		}
	},
	{
		description: 'null and undefined',
		answer: false,
		input: {
			one: null,
			two: undefined
		}
	},
	{
		description: 'undefined and undefined',
		answer: true,
		input: {
			one: undefined,
			two: undefined
		}
	}
];

export const TestSuit_ts_compare: TestSuitV2 = {
	label: 'Compare Test',
	testcases: TestCase_ts_compare
};