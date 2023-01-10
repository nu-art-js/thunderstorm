import {TestSuit_TS_Merge} from './types';
import {merge} from '../../../main';


const TestCase_ts_merge: TestSuit_TS_Merge['testcases'] = [
	{
		description: 'merge two objects',
		result: {a: 1, b: 2},
		input: {
			one: {a: 1},
			two: {b: 2}
		},
	}
];

export const TestSuit_ts_merge: TestSuit_TS_Merge = {
	label: 'Merge Test',
	testcases: TestCase_ts_merge,
	processor: input => merge(input.one, input.two)
};