import {expect} from 'chai';
import {TestSuite} from '../../main/testing/types';
import {ReplacerV2, ReplacerV2_Input} from '../../main/replacer-v2/ReplacerV2';


type Input = {
	text: string
	input?: ReplacerV2_Input
}

const TestCase_replacerV2: TestSuite<Input, string> ['testcases'] = [
	{
		description: 'simple test',
		result: [{a: 'adam', b: 'is', c: 'king'}],
		input: {
			filename: 'example1.csv',
		}
	},
];

export const TestSuite_replacerV2: TestSuite<Input, any> = {
	label: 'replacerV2',
	testcases: TestCase_replacerV2,
	processor: async (testCase) => {
		const result = new ReplacerV2().replace(testCase.input.text, testCase.input.input);
		const expected = testCase.result;
		expect(result).to.eql(expected);
	}
};

