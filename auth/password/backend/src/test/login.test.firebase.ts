import {MemKey_HttpResponse} from '@nu-art/http-server';
import {TestSuite} from '@nu-art/testalot';
import {runSingleTestCase} from '@nu-art/testalot';
import {generateHex} from '@nu-art/ts-common';
import {stormTester, StormTestInput} from '@nu-art/storm-testalot';
import {DefaultStormTestConfig_PasswordAuth} from './utils/helpers.js';
import {API_PasswordAuth, Request_RegisterAccount} from '@nu-art/password-auth-shared';
import {ModuleBE_PasswordAuth} from './_main.js';

export type Input = {
	registerCredentials: Request_RegisterAccount;
	loginCredentials: API_PasswordAuth['login']['Body'];
};

export type Result = boolean;

export type TestSuite_AccountLogin = TestSuite<Input, Result>;
export type TestCase_AccountLogin = TestSuite_AccountLogin['testcases'][number];

const deviceId = generateHex(32);

const test = async (input: Input) => {
	ModuleBE_PasswordAuth.setDefaultConfig({
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

	await ModuleBE_PasswordAuth.registerAccount(input.registerCredentials);
	await ModuleBE_PasswordAuth.handleLogin(input.loginCredentials);

	return true;
};

const runTestCase = (testCase: TestCase_AccountLogin) => async () => runSingleTestCase(test, testCase);

const DefaultStormTest: StormTestInput = {
	...DefaultStormTestConfig_PasswordAuth,
};

describe('Accounts - Login', () => {
	it('Login Pass', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			input: {
				registerCredentials: {
					email: 'test@email.com',
					password: '1234',
					passwordCheck: '1234',
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
