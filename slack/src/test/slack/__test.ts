import {TestSuite_SlackMessage} from './slack';
import {ConfigType_ModuleBE_Slack, ModuleBE_Slack} from '../../main';
import {ModuleManagerTester, testSuiteTester} from '@nu-art/ts-common/testing/consts';
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
	testSuiteTester(TestSuite_SlackMessage);
});