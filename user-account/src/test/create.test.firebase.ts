import {Account_CreateAccount, MemKey_AccountEmail, ModuleBE_AccountDB, ModuleBE_SessionDB} from '../main/backend';
import {Request_RegisterAccount} from '../main';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {PartialProperties} from '@nu-art/ts-common';
import {StormTest} from '@nu-art/thunderstorm/backend/test/StormTest';
import {ModuleBE_APIs, ModuleBE_SyncManager} from '@nu-art/thunderstorm/backend';

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

describe('Accounts - Create', () => {
	const modules = [
		ModuleBE_APIs,
		ModuleBE_SyncManager,
		ModuleBE_AccountDB,
		ModuleBE_SessionDB
	];

	const stormTest = new StormTest({modules, config: {}});
	before(async () => {
		await stormTest.init();
	});

	beforeEach(async () => {
		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	});

	it('Create With password', runTestCase({
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

	it('Without password', runTestCase({
		description: 'Without password',
		input: {
			createCredentials: {
				email: 'test@email.com',
				type: 'user'
			}
		},
		result: true
	}));

	it('Password without passwordCheck', runTestCase({
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

	it('passwordCheck without password', runTestCase({
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

	after(async () => {
		await stormTest.cleanup();
	});
});
