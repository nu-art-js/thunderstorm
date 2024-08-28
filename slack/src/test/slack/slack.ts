import {expect} from 'chai';
import {ModuleBE_Slack, Slack_ServerApiError, SlackMessage} from '../../main';
import {TestSuite} from '@thunder-storm/common/testing/types';
import {CustomException, ServerErrorSeverity, BadImplementationException, ThisShouldNotHappenException} from '@thunder-storm/common';
import {ApiException} from '@thunder-storm/core/backend';


const TestCase_SlackMessage: TestSuite<string, string> ['testcases'] = [
	{
		description: 'no params',
		result: 'This is a simple text',
		input: 'Ze Zevel'
	},
	{
		description: 'simple param',
		result: `This is a PARAM text`,
		input: 'Ze od Zevel'
	},
];

export const TestSuite_SlackMessage: TestSuite<string, any> = {
	label: 'Slack Tests',
	testcases: TestCase_SlackMessage,
	processor: async (testCase) => {
		const result = await ModuleBE_Slack.postMessage(testCase.input);
		// const expected = testCase.result;
		// expect(result).to.eql(expected);
	}
};

const TestCases_SlackServerAPIError: TestSuite<CustomException, string> ['testcases'] = [
	{description: 'Exception Test #1', result: 'test', input: new ApiException(400, 'API Exception Test')},
	{description: 'Exception Test #2', result: 'test', input: new BadImplementationException('Bad Implementation Test')},
	{description: 'Exception Test #3', result: 'test', input: new ThisShouldNotHappenException('Should not happen Test')},
];

export const TestSuite_SlackServerAPIError: TestSuite<CustomException, string> = {
	label: 'Slack API Error Tests',
	testcases: TestCases_SlackServerAPIError,
	processor: async (testCase) => {
		const result = await Slack_ServerApiError.__processExceptionError(ServerErrorSeverity.Error, testCase.input);
	}
};