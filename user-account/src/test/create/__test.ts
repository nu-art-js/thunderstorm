import {ModuleBE_v2_AccountDB} from '../../main/backend';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {RequestBody_CreateAccount} from '../../main';
import {PasswordAssertionConfig} from '../../main/shared/v2/assertion';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {exists} from '@nu-art/ts-common';
import {expect} from 'chai';
import '../_core/consts';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export type CreateAccountInput = {
	account: RequestBody_CreateAccount
	canRegister?: boolean
	assertionConfig?: PasswordAssertionConfig
}

type CreateAccountTest = TestSuite<CreateAccountInput, boolean>;


const TestCases_FB_Create: CreateAccountTest['testcases'] = [
	{
		description: 'Simple',
		input: {account: {email: 'test@email.com', password: '1234', password_check: '1234'}},
		result: true
	},
	{
		description: 'Simple with Assertion',
		input: {
			account: {email: 'test@email.com', password: '1234', password_check: '1234'},
			assertionConfig: {'min-length': 0, 'max-length': 5}
		},
		result: true
	},
	{
		description: 'Too Short p/w',
		input: {
			account: {email: 'test@email.com', password: '1234', password_check: '1234'},
			assertionConfig: {'min-length': 5}
		},
		result: false
	},
	{
		description: 'Too long p/w',
		input: {
			account: {email: 'test@email.com', password: '123456', password_check: '123456'},
			assertionConfig: {'max-length': 5}
		},
		result: false
	},
	{
		description: 'enough numbers',
		input: {
			account: {email: 'test@email.com', password: '1234', password_check: '1234'},
			assertionConfig: {numbers: 2}
		},
		result: true
	},
	{
		description: 'not enough numbers',
		input: {
			account: {email: 'test@email.com', password: '1234', password_check: '1234'},
			assertionConfig: {numbers: 5}
		},
		result: false
	},
	{
		description: 'enough special chars',
		input: {
			account: {email: 'test@email.com', password: '1234!@#$', password_check: '1234!@#$'},
			assertionConfig: {'special-chars': 4}
		},
		result: true
	},
	{
		description: 'not enough special chars',
		input: {
			account: {email: 'test@email.com', password: '12#34!', password_check: '12#34!'},
			assertionConfig: {'special-chars': 4}
		},
		result: false
	},
	{
		description: 'enough capital letters',
		input: {
			account: {email: 'test@email.com', password: 'ABCDE12#34!', password_check: 'ABCDE12#34!'},
			assertionConfig: {'capital-letters': 4}
		},
		result: true
	},
	{
		description: 'not enough capital letters',
		input: {
			account: {email: 'test@email.com', password: '12#34!', password_check: '12#34!'},
			assertionConfig: {'capital-letters': 4}
		},
		result: false
	},
	{
		description: 'enough lower case letters',
		input: {
			account: {email: 'test@email.com', password: 'abcde12#34!', password_check: 'abcde12#34!'},
			assertionConfig: {'lower-case-letters': 1}
		},
		result: true
	},
	{
		description: 'not enough lower case letters',
		input: {
			account: {email: 'test@email.com', password: '12#34!', password_check: '12#34!'},
			assertionConfig: {'lower-case-letters': 4}
		},
		result: false
	},
	{
		description: 'complex pass',
		input: {
			account: {email: 'test@email.com', password: 'Aa!12345', password_check: 'Aa!12345'},
			assertionConfig: {
				'min-length': 5,
				'max-length': 8,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: true
	},
	{
		description: 'complex fail',
		input: {
			account: {email: 'test@email.com', password: '123456789', password_check: 'Aa!12345'},
			assertionConfig: {
				'min-length': 5,
				'max-length': 8,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: false
	}
];


TestCases_FB_Create.forEach(testCase => testCase.description = `${testCase.description}: ${testCase.input.account.email} - ${testCase.input.account.password}`);
export const TestSuite_Accounts_Create: CreateAccountTest = {
	label: 'Account register test',
	testcases: TestCases_FB_Create,
	processor: async (testCase) => {
		const cleanObject = {
			'max-length': undefined,
			'min-length': undefined,
			'numbers': undefined,
			'capital-letters': undefined,
			'special-chars': undefined
		};
		ModuleBE_v2_AccountDB.setDefaultConfig({
			canRegister: exists(testCase.input.canRegister) ? testCase.input.canRegister : true,
			passwordAssertion: {...cleanObject, ...testCase.input.assertionConfig} // setting all redundant fields as undefined verifies the config doesn't carry garbage fields.
		});
		// // @ts-ignore // debug only
		// console.log(ModuleBE_v2_AccountDB.config); // debug only

		await ModuleBE_v2_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		let result: boolean | undefined;
		try {
			await new MemStorage().init(() => ModuleBE_v2_AccountDB.account.register(testCase.input.account));
			result = true;
		} catch (e: any) {
			console.error(`${testCase.description} failed because: ${e.message}`);
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};

describe('Accounts - Create', () => {
	testSuiteTester(TestSuite_Accounts_Create);
});