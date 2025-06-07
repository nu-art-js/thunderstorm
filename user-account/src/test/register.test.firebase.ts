import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {generateHex} from '@nu-art/ts-common';
import {Account_RegisterAccount, PasswordAssertionConfig} from '../main';
import {ModuleBE_AccountDB, ModuleBE_SessionDB} from '../main/backend';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {StormTest} from '@nu-art/thunderstorm/backend/test/StormTest';
import {ModuleBE_APIs, ModuleBE_SyncManager} from '@nu-art/thunderstorm/backend';

export type Input = {
	account: Account_RegisterAccount['request'];
	canRegister?: boolean;
	assertionConfig?: PasswordAssertionConfig;
};

export type Result = boolean;

export type TestSuite_AccountRegister = TestSuite<Input, Result>;
export type TestCase_AccountRegister = TestSuite_AccountRegister['testcases'][number];

const deviceId = generateHex(32);

const test = async (input: Input) => {
	const cleanObject = {
		'max-length': undefined,
		'min-length': undefined,
		'numbers': undefined,
		'capital-letters': undefined,
		'lower-case-letters': undefined,
		'special-chars': undefined
	};

	ModuleBE_AccountDB.setDefaultConfig({
		canRegister: input.canRegister ?? true,
		passwordAssertion: {...cleanObject, ...input.assertionConfig}
	});

	const fakeResponse: any = {
		setHeader: () => {
		}
	};
	MemKey_HttpResponse.set(fakeResponse);
	await ModuleBE_AccountDB.account.register(input.account);
	return true;
};


const runTestCase = (testCase: TestCase_AccountRegister) => async () => runSingleTestCase(test, testCase);

describe('Accounts - Register', () => {
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

	it('Simple: test@email.com - 1234', runTestCase({
		description: 'Simple',
		input: {
			account: {email: 'test@email.com', password: '1234', passwordCheck: '1234', deviceId}
		},
		result: true
	}));

	it('Can register false: test@email.com - 1234', runTestCase({
		description: 'Can register false',
		input: {
			account: {email: 'test@email.com', password: '1234', passwordCheck: '1234', deviceId},
			canRegister: false,
		},
		error: {expected: 'Registration is disabled'}
	}));

	it('With Assertion - Pass: test@email.com - 1234', runTestCase({
		description: 'With Assertion - Pass',
		input: {
			account: {email: 'test@email.com', password: '1234', passwordCheck: '1234', deviceId},
			assertionConfig: {'min-length': 0, 'max-length': 5}
		},
		result: true
	}));

	it('With Assertion - Fail: test@email.com - 123456', runTestCase({
		description: 'With Assertion - Fail',
		input: {
			account: {email: 'test@email.com', password: '123456', passwordCheck: '123456', deviceId},
			assertionConfig: {'min-length': 0, 'max-length': 5},
		},
		error: {expected: 'Password assertion failed'}
	}));

	it('Password Mismatch: test@email.com - 1234', runTestCase({
		description: 'Password Mismatch',
		input: {
			account: {email: 'test@email.com', password: '1234', passwordCheck: '12345', deviceId},
			assertionConfig: {'min-length': 0, 'max-length': 5},
		},
		error: {expected: 'Password does not match password check'}
	}));

	after(async () => {
		await stormTest.cleanup();
	});
});


