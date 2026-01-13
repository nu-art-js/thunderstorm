import {MemKey_HttpResponse} from '@nu-art/thunderstorm-backend/modules/server/consts';
import {TestSuite} from '@nu-art/testalot';
import {runSingleTestCase} from '@nu-art/testalot';
import {generateHex} from '@nu-art/ts-common';
import {stormTester, StormTestInput} from '@nu-art/thunderstorm-backend/test/StormTest';
import {DefaultStormTestConfig_SessionAndAccount} from './utils/helpers.js';
import {Account_Login, Request_RegisterAccount} from '@nu-art/user-account-shared';
import {ModuleBE_AccountDB, ModuleBE_FailedLoginAttemptDB} from './_main.js';

export type Input = {
	registerCredentials: Request_RegisterAccount;
	loginCredentials: Account_Login['request'];
};

export type Result = boolean;

export type TestSuite_AccountLogin = TestSuite<Input, Result>;
export type TestCase_AccountLogin = TestSuite_AccountLogin['testcases'][number];

const deviceId = generateHex(32);

const test = async (input: Input) => {
	ModuleBE_AccountDB.setDefaultConfig({
		passwordAssertion: {
			'max-length': undefined,
			'min-length': undefined,
			'numbers': undefined,
			'capital-letters': undefined,
			'lower-case-letters': undefined,
			'special-chars': undefined
		},
		canRegister: true
	});

	MemKey_HttpResponse.set({
		setHeader: () => {
		}
	} as any);

	await ModuleBE_AccountDB.account.register(input.registerCredentials);
	await ModuleBE_AccountDB.account.login(input.loginCredentials);

	return true;
};

const runTestCase = (testCase: TestCase_AccountLogin) => async () => runSingleTestCase(test, testCase);

const DefaultStormTest: StormTestInput = {
	...DefaultStormTestConfig_SessionAndAccount,
	modules: [
		...DefaultStormTestConfig_SessionAndAccount.modules,
		ModuleBE_FailedLoginAttemptDB,
	],
	before: async () => {
		await DefaultStormTestConfig_SessionAndAccount.before();
		await ModuleBE_FailedLoginAttemptDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	},
	after: async () => {
		await ModuleBE_FailedLoginAttemptDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await DefaultStormTestConfig_SessionAndAccount.after();
	}
};

describe('Accounts - Login', () => {
	it('Login Pass', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			input: {
				registerCredentials: {
					email: 'test@email.com',
					password: '1234',
					passwordCheck: '1234',
					type: 'user',
					deviceId
				},
				loginCredentials: {
					email: 'test@email.com',
					password: '1234',
					deviceId
				}
			},
			result: true
		}));
	});

	it('Login Fail - Email', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			input: {
				registerCredentials: {
					email: 'test@email.com',
					password: '1234',
					passwordCheck: '1234',
					type: 'user',
					deviceId
				},
				loginCredentials: {
					email: 'test1@email.com',
					password: '12344',
					deviceId
				}
			},
			error: {expected: 'There is no account for email'}
		}));
	});

	it('Login Fail - Password', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			input: {
				registerCredentials: {
					email: 'test@email.com',
					password: '1234',
					passwordCheck: '1234',
					type: 'user',
					deviceId
				},
				loginCredentials: {
					email: 'test@email.com',
					password: '12345',
					deviceId
				}
			},
			error: {expected: 'Wrong username or password'}
		}));
	});
});
