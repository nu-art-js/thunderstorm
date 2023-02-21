import {expect} from 'chai';
import {filterFalsy, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
}

const TestCase_filterFalsy: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 2, 3],
		input: {
			array: [1, 2, 3, 0, null],
		}
	},
	{
		description: 'Test 2',
		result: [1, 2, 3],
		input: {
			array: [1, 2, 3, '', undefined],
		}
	},
	{
		description: 'Test 3',
		result: [1, 2, 3, {}],
		input: {
			array: [1, 2, 3, '', undefined, {}],
		}
	},
	{
		description: 'Test 4',
		result: [1, 2, 3, {}],
		input: {
			array: [1, 2, 3, '', undefined, {}, false],
		}
	},
];

export const TestSuite_filterFalsy: TestSuite<Input, any> = {
	label: 'filterFalsy',
	testcases: TestCase_filterFalsy,
	processor: async (testCase) => {
		const result = filterFalsy(testCase.input.array);
		const expected = testCase.result;
		expect(result).to.deep.equals(expected);
	}
};