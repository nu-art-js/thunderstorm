import {expect} from 'chai';
import {TestSuite} from '../../main/testing/types';
import {ReplacerV2, ReplacerV2_Input} from '../../main/replacer-v2/ReplacerV2';


type Input = {
	text: string
	input?: ReplacerV2_Input
}

const TestCase_replacerV2: TestSuite<Input, string> ['testcases'] = [
	{
		description: 'no params',
		result: 'This is a simple text',
		input: {
			text: 'This is a simple text',
			input: undefined
		}
	},
	{
		description: 'simple param',
		result: `This is a PARAM text`,
		input: {
			text: 'This is a ${p} text',
			input: {p: 'PARAM'}
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

