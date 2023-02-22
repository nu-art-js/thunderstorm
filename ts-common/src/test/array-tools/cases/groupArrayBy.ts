import {expect} from 'chai';
import {groupArrayBy, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	mapper: (item: T) => any
}

const TestCase_groupArrayBy: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [{'key': '0', 'values': [{'age': 0, gender: 'male'}, {age: 0, gender: 'female'}]}, {'key': '1', 'values': [{'age': 1, gender: 'male'}]}],
		input: {
			array: [{age: 0, gender: 'male'}, {age: 0, gender: 'female'}, {age: 1, gender: 'male'}],
			mapper: (item) => item.age
		}
	},
];

export const TestSuite_groupArrayBy: TestSuite<Input, any> = {
	label: 'groupArrayBy',
	testcases: TestCase_groupArrayBy,
	processor: async (testCase) => {
		const result = groupArrayBy(testCase.input.array, testCase.input.mapper);
		const expected = testCase.result;
		expect(result).to.deep.equals(expected);
	}
};