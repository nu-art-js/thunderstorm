import {expect} from 'chai';
import {arrayToMap, TestSuite } from '../../_main';

type Input<T = any> = {
	array: T[]
	getKey: (item: T, index: number, map: { [k: string]: T }) => string | number
	map?: {}
}

const TestCase_arrayToMap: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Number array to map',
		result: {0: 1, 1: 2, 2: 3},
		input: {
			array: [1, 2, 3],
			getKey: (item, index) => index,
		}
	},
	{
		description: 'String array to map',
		result: {0: 'zero', 1: 'one', 2: 'two'},
		input: {
			array: ['zero', 'one', 'two'],
			getKey: (item, index) => index,
		}
	},
];

export const TestSuite_arrayToMap: TestSuite<Input, any> = {
	label: 'arrayToMap',
	testcases: TestCase_arrayToMap,
	processor: async (testCase) => {
		it(testCase.description, () => {
			const result = arrayToMap(testCase.input.array, testCase.input.getKey, testCase.input.map ?? {});
			const expected = testCase.result;
			expect(result).to.eql(expected);
		});
	}
};