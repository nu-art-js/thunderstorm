import {TestSuit_TS_Merge} from './types';
import {merge} from '../../main';


const TestCase_ts_merge: TestSuit_TS_Merge['testcases'] = [
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
			one: {a: 1,b:1},
			two: {a: 2,b:2}
		},
	},
	{
		description: 'merge two overlapping objects',
		result: {a:2,b:1,c:3},
		input: {
			one: {a: 2, b: undefined, c: 5},
			two: {b: 1, c: 3, d: null}
		},
	},
	{
		description: 'merge two overlapping objects',
		result: {a:2,c:5,d:null},
		input: {
			one: {b: 1, c: 3, d: null},
			two: {a: 2, b: undefined, c: 5}
		},
	},
	{
		description: 'merge two arrays',
		result: [],
		input: {
			one: [1,2,3,4,5],
			two: []
		},
	},
	{
		description: 'merge two arrays',
		result: [1,2,3,4,5],
		input: {
			one: [],
			two: [1,2,3,4,5]
		},
	},
	{
		description: 'merge two arrays',
		result: [1,2,3,4,5],
		input: {
			one: [7,8],
			two: [1,2,3,4,5]
		},
	},
	{
		description: 'merge obj obj',
		result: {a:{a:{}}},
		input: {
			one: {a:{a:{}}},
			two: {a:{}}
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

export const TestSuit_ts_merge: TestSuit_TS_Merge = {
	label: 'Merge Test',
	testcases: TestCase_ts_merge,
	processor: input => merge(input.one, input.two)
};