import {expect} from 'chai';
import {reduceToMap, TestSuite} from '../../_main';

type Input<T = any> = {
	array: T[]
	keyResolver: (item: T) => any
	mapper: (item: T, index: number) => any
	map?: {}
}

const TestCase_reduceToMap: TestSuite<Input, any> ['testcases'] = [
	{
		description: 'Test 1',
		result: {Alon: 27, Itay: 28},
		input: {
			array: [{name: 'Alon', age: 27}, {name: 'Itay', age: 28}],
			keyResolver: (item: { name: string, age: number }) => item.name,
			mapper: (item: { name: string, age: number }) => item.age,
		}
	},
	{
		description: 'Test 2',
		result: {Alon: 0, Itay: 1},
		input: {
			array: ['Alon', 'Itay'],
			keyResolver: (item: string) => item,
			mapper: (item, index) => index,
		}
	},
];

export const TestSuite_reduceToMap: TestSuite<Input, any> = {
	label: 'reduceToMap',
	testcases: TestCase_reduceToMap,
	processor: async (testCase) => {
		it(testCase.description, () => {
			const result = reduceToMap(testCase.input.array, testCase.input.keyResolver, testCase.input.mapper, testCase.input.map || {});
			const expected = testCase.result;
			expect(result).to.deep.equals(expected);
		});
	}
};