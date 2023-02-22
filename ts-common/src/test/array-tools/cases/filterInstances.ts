import {expect} from 'chai';
import {filterInstances, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
}

const TestCase_filterInstances: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 2, 3, 0],
		input: {
			array: [1, 2, 3, 0, null],
		}
	},
	{
		description: 'Test 2',
		result: [1, 2, 3, ''],
		input: {
			array: [1, 2, 3, '', undefined],
		}
	},
	{
		description: 'Test 3',
		result: [1, 2, 3, '', {}],
		input: {
			array: [1, 2, 3, '', undefined, {}],
		}
	},
	{
		description: 'Test 4',
		result: [1, 2, 3, '', {}, false],
		input: {
			array: [1, 2, 3, '', undefined, {}, false],
		}
	},
];

export const TestSuite_filterInstances: TestSuite<Input, any> = {
	label: 'filterInstances',
	testcases: TestCase_filterInstances,
	processor: async (testCase) => {
		const result = filterInstances(testCase.input.array);
		const expected = testCase.result;
		expect(result).to.deep.equals(expected);
	}
};