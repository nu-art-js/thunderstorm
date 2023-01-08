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
		one: '1',
		two: '1',
		answer: true
	},
	{
		description: 'compares different integers',
		one: 1,
		two: 2,
		answer: false
	},
	{
		description: 'compares different integers',
		one: 2,
		two: 1,
		answer: false
	},
	{
		description: 'compares same val with different type',
		one: '1',
		two: 1,
		answer: false
	},
	{
		description: 'compares same val with different type',
		one: 1,
		two: '1',
		answer: false
	},
	{
		description: 'compares same string word',
		one: 'test',
		two: 'test',
		answer: true
	},
	{
		description: 'compares different string',
		one: 'test',
		two: 'tesT',
		answer: false
	},
	{
		description: 'compares different string',
		one: 'test',
		two: 'test1',
		answer: false
	},
];

export const TestSuit_ts_compare: TestSuitV2 = {
	label: 'Compare Test',
	testcases: TestCase_ts_compare
};