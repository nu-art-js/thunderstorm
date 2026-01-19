import {runSingleTestCase} from '@nu-art/testalot';
import {generateHex} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/testalot';
import {stormTester, StormTestInput} from '@nu-art/thunderstorm-backend/test/StormTest';
import {DefaultStormTestConfig_SessionAndAccount, ModuleDummy_Claims, TestHelper_InterceptJwtHeader} from './utils/helpers.js';
import { Account_RegisterAccount, PasswordAssertionConfig } from '@nu-art/user-account-shared';
import { ModuleBE_AccountDB } from './_main.js';

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

	await TestHelper_InterceptJwtHeader(ModuleBE_AccountDB.account.register(input.account));
	return true;
};

const DefaultStormTest: StormTestInput = {
	...DefaultStormTestConfig_SessionAndAccount,
	before: async () => {
		ModuleDummy_Claims.value = '8888';
		await DefaultStormTestConfig_SessionAndAccount.before?.();
	},
	after: async () => {
		await DefaultStormTestConfig_SessionAndAccount.after?.();
		ModuleDummy_Claims.value = '8888';
	},
};

const runTestCase = (testCase: TestCase_AccountRegister) => async () => runSingleTestCase(test, testCase);

describe('Accounts - Register', () => {
	it('Simple: test@email.com - 1234', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Simple',
			input: {
				account: {email: 'test@email.com', password: '1234', passwordCheck: '1234', deviceId}
			},
			result: true
		}));
	});

	it('Can register false: test@email.com - 1234', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Can register false',
			input: {
				account: {email: 'test@email.com', password: '1234', passwordCheck: '1234', deviceId},
				canRegister: false,
			},
			error: {expected: 'Registration is disabled'}
		}));
	});

	it('With Assertion - Pass: test@email.com - 1234', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'With Assertion - Pass',
			input: {
				account: {email: 'test@email.com', password: '1234', passwordCheck: '1234', deviceId},
				assertionConfig: {'min-length': 0, 'max-length': 5}
			},
			result: true
		}));
	});

	it('With Assertion - Fail: test@email.com - 123456', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'With Assertion - Fail',
			input: {
				account: {email: 'test@email.com', password: '123456', passwordCheck: '123456', deviceId},
				assertionConfig: {'min-length': 0, 'max-length': 5},
			},
			error: {expected: 'Password assertion failed'}
		}));
	});

	it('Password Mismatch: test@email.com - 1234', async () => {
		await stormTester(DefaultStormTest, runTestCase({
			description: 'Password Mismatch',
			input: {
				account: {email: 'test@email.com', password: '1234', passwordCheck: '12345', deviceId},
				assertionConfig: {'min-length': 0, 'max-length': 5},
			},
			error: {expected: 'Password does not match password check'}
		}));
	});
});

