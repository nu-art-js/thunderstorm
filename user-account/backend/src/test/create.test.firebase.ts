import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {PartialProperties} from '@nu-art/ts-common';
import {stormTester, StormTestInput} from '@nu-art/thunder-db-api-backend/test/StormTest';
import {DefaultStormTestConfig_SessionAndAccount} from './utils/helpers.js';
import { Account_CreateAccount, Request_RegisterAccount } from '@nu-art/user-account-shared';
import {MemKey_AccountEmail, ModuleBE_AccountDB} from './_main.js';

export type Input = {
	createCredentials: PartialProperties<Account_CreateAccount['request'], 'password' | 'passwordCheck'>;
};

export type Result = boolean;

export type TestSuite_AccountCreate = TestSuite<Input, Result>;
export type TestCase_AccountCreate = TestSuite_AccountCreate['testcases'][number];


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

	MemKey_AccountEmail.set('test');
	await ModuleBE_AccountDB.account.create(input.createCredentials as Request_RegisterAccount);

	return true;
};

const runTestCase = (testCase: TestCase_AccountCreate) => async () => runSingleTestCase(test, testCase);

const DefaultStormTest: StormTestInput = {
	...DefaultStormTestConfig_SessionAndAccount,
};

describe('Accounts - Create', () => {
	it('Create With password', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Create With password',
			input: {
				createCredentials: {
					email: 'test@email.com',
					password: '1234',
					passwordCheck: '1234',
					type: 'user'
				}
			},
			result: true
		}));
	});

	it('Without password', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Without password',
			input: {
				createCredentials: {
					email: 'test@email.com',
					type: 'user'
				}
			},
			result: true
		}));
	});

	it('Password without passwordCheck', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Password without passwordCheck',
			input: {
				createCredentials: {
					email: 'test@email.com',
					password: '1234',
					type: 'user'
				}
			},

			error: {expected: '400-"Did not receive'}
		}));
	});

	it('passwordCheck without password', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'passwordCheck without password',
			input: {
				createCredentials: {
					email: 'test@email.com',
					passwordCheck: '1234',
					type: 'user'
				}
			},
			error: {expected: '400-"Did not receive'}
		}));
	});
});
