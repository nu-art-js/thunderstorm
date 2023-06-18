import {expect} from 'chai';
import {ModuleBE_Slack, SlackMessage} from '../../main';
import {TestSuite} from '@nu-art/ts-common/testing/types';


const TestCase_SlackMessage: TestSuite<SlackMessage, string> ['testcases'] = [
	{
		description: 'no params',
		result: 'This is a simple text',
		input: {text: 'Ze Zevel'}
	},
	{
		description: 'simple param',
		result: `This is a PARAM text`,
		input: {text: 'Ze od Zevel'}
	},
];

export const TestSuite_SlackMessage: TestSuite<SlackMessage, any> = {
	label: 'Slack Tests',
	testcases: TestCase_SlackMessage,
	processor: async (testCase) => {
		const result = await ModuleBE_Slack.postMessage(testCase.input);
		console.log(result);

		const expected = testCase.result;
		expect(result).to.eql(expected);
	}
};