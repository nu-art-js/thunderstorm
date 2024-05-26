import {TestSuite} from '@nu-art/ts-common/testing/types';
import {Exception} from '@nu-art/ts-common';
import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {Account_RegisterAccount, PasswordAssertionConfig} from '../../main';
import {ModuleBE_AccountDB} from '../../main/backend';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';


export type registerAccountInput = {
	account: Account_RegisterAccount['request']
	canRegister?: boolean
	assertionConfig?: PasswordAssertionConfig
	ignoreErrorWithText?: string;
}

type RegisterAccountTest = TestSuite<registerAccountInput, boolean>;

const TestCases_FB_Register: RegisterAccountTest['testcases'] = [
	{
		description: 'Simple account',
		input: {account: {email: 'test@email.com', password: '1234', passwordCheck: '1234'}},
		result: true,
	},
	{
		description: 'Can register false',
		input: {
			account: {email: 'test@email.com', password: '1234', passwordCheck: '1234'},
			canRegister: false,
			ignoreErrorWithText: 'Registration is disabled'
		},
		result: false
	},
	{
		description: 'With Assertion - Pass',
		input: {
			account: {email: 'test@email.com', password: '1234', passwordCheck: '1234'},

			assertionConfig: {'min-length': 0, 'max-length': 5}
		},
		result: true
	},
	{
		description: 'With Assertion - Fail',
		input: {
			account: {email: 'test@email.com', password: '123456', passwordCheck: '123456'},
			ignoreErrorWithText: 'Password assertion failed',
			assertionConfig: {'min-length': 0, 'max-length': 5}
		},
		result: false
	},
	{
		description: 'Password Mismatch',
		input: {
			account: {email: 'test@email.com', password: '1234', passwordCheck: '12345'},
			ignoreErrorWithText: 'Password does not match password check',
			assertionConfig: {'min-length': 0, 'max-length': 5}
		},
		result: false
	},
];

TestCases_FB_Register.forEach(testCase => testCase.description = `${testCase.description}: ${testCase.input.account.email} - ${testCase.input.account.password}`);
export const TestSuite_Accounts_Register: RegisterAccountTest = {
	label: '\n################ Account register Tests ################\n',
	testcases: TestCases_FB_Register,
	processor: async (testCase) => {
		const cleanObject = {
			'max-length': undefined,
			'min-length': undefined,
			'numbers': undefined,
			'capital-letters': undefined,
			'lower-case-letters': undefined,
			'special-chars': undefined
		};
		ModuleBE_AccountDB.setDefaultConfig({
			canRegister: testCase.input.canRegister ?? true,
			passwordAssertion: {...cleanObject, ...testCase.input.assertionConfig} // setting all redundant fields as undefined verifies the config doesn't carry garbage fields.
		});
		// // @ts-ignore // debug only
		// console.log(ModuleBE_AccountDB.config); // debug only

		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		let result: boolean | undefined;
		try {
			await new MemStorage().init(() => ModuleBE_AccountDB.account.register(testCase.input.account));
			result = true;
		} catch (e: any) {
			if (!testCase.input.ignoreErrorWithText || !(e as Exception).message.includes(testCase.input.ignoreErrorWithText)) {
				console.error(`${testCase.description} failed because: ${e.message}`);
				throw e;
			}

			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};

describe('Accounts - Register', () => {
	testSuiteTester(TestSuite_Accounts_Register);
});