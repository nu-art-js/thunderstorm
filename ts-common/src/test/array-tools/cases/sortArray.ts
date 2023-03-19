import {expect} from 'chai';
import {sortArray, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	map: (item: T) => any;
	invert?: boolean
}

const TestCase_sortArray: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: [{name: 'Adam', shoeSize: 45}, {name: 'Alon', shoeSize: 47.5}, {name: 'Itay', shoeSize: 50}],
		input: {
			array: [{name: 'Alon', shoeSize: 47.5}, {name: 'Itay', shoeSize: 50}, {name: 'Adam', shoeSize: 45}],
			map: (item: { name: string, shoeSize: number }) => item.shoeSize,
			invert: false
		}
	},
];

export const TestSuite_sortArray: TestSuite<Input, any> = {
	label: 'sortArray',
	testcases: TestCase_sortArray,
	processor: async (testCase) => {
		const result = sortArray(testCase.input.array, testCase.input.map, testCase.input.invert);
		const expected = testCase.result;
		expect(result).to.deep.equals(expected);
	}
};