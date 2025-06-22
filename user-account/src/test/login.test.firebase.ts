import {Account_Login, Request_RegisterAccount} from '../main';
import {ModuleBE_AccountDB, ModuleBE_FailedLoginAttemptDB, ModuleBE_SessionDB} from '../main/backend';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {generateHex} from '@nu-art/ts-common';
import {StormTest} from '@nu-art/thunderstorm/backend/test/StormTest';
import {ModuleBE_APIs, ModuleBE_SyncManager} from '@nu-art/thunderstorm/backend';

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

describe('Accounts - Login', () => {

	const modules = [
		ModuleBE_APIs,
		ModuleBE_SyncManager,
		ModuleBE_AccountDB,
		ModuleBE_FailedLoginAttemptDB,
		ModuleBE_SessionDB
	];

	const stormTest = new StormTest({modules, config: {}});
	before(async () => {
		await stormTest.init();
		ModuleBE_SessionDB['jwtHandler']['secret'].get = async () => ['secret'];
	});
	beforeEach(async () => {
		await ModuleBE_FailedLoginAttemptDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	});

	it('Login Pass', runTestCase({
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

	it('Login Fail - Email', runTestCase({
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

	it('Login Fail - Password', runTestCase({
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

	after(async () => {
		await stormTest.cleanup();
	});
});
