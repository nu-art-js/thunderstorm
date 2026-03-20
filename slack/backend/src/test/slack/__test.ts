import {TestSuite_SlackServerAPIError} from './slack.js';
import {Config, ModuleBE_Slack} from '../../main/index.js';
import {ModuleManagerTester, testSuiteTester} from '@nu-art/testalot';
import {Second} from '@nu-art/ts-common';


const config: ConfigType_ModuleBE_Slack = {
	defaultChannel: '__slack-tester',
	throttlingTime: 10 * Second,
	token: process.env.SlackToken!
};

const fullConfig = {
	[ModuleBE_Slack['name']]: config
};

describe('Slack Module', () => {
	new ModuleManagerTester().setConfig(fullConfig).addModulePack([ModuleBE_Slack]).build();
	testSuiteTester(TestSuite_SlackServerAPIError);
});