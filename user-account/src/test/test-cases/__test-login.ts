import {Request_CreateAccount, Request_LoginAccount} from '../../main';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {ModuleBE_v2_AccountDB} from '../../main/backend';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {expect} from 'chai';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';


export type loginInput = {
	registerCredentials: Request_CreateAccount
	loginCredentials: Request_LoginAccount
	ignoreErrorWithText?: string
}

type LoginAccountTest = TestSuite<loginInput, boolean>;

const TestCases_FB_Login: LoginAccountTest['testcases'] = [
	{
		description: 'Login Pass',
		input: {
			registerCredentials: {email: 'test@email.com', password: '1234', password_check: '1234', type: 'user'},
			loginCredentials: {email: 'test@email.com', password: '1234'}
		},
		result: true
	},
	{
		description: 'Login Fail - Email',
		input: {
			registerCredentials: {email: 'test@email.com', password: '1234', password_check: '1234', type: 'user'},
			loginCredentials: {email: 'test1@email.com', password: '12344'},
			ignoreErrorWithText: 'Could not find Account with unique query'
		},
		result: false
	},
	{
		description: 'Login Fail - Password',
		input: {
			registerCredentials: {email: 'test@email.com', password: '1234', password_check: '1234', type: 'user'},
			loginCredentials: {email: 'test@email.com', password: '12345'},
			ignoreErrorWithText: 'Wrong username or password',
		},
		result: false
	},
];

export const TestSuite_Accounts_Login: LoginAccountTest = {
	label: '\n################ Account Login Tests ################\n',
	testcases: TestCases_FB_Login,
	processor: async (testCase) => {
		ModuleBE_v2_AccountDB.setDefaultConfig({
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
		// // @ts-ignore // debug only
		// console.log(ModuleBE_v2_AccountDB.config); // debug only

		await ModuleBE_v2_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		let result: boolean | undefined;
		try {
			await new MemStorage().init(async () => {
				await ModuleBE_v2_AccountDB.account.register(testCase.input.registerCredentials);
			});
			await new MemStorage().init(async () => {
				// console.log(await ModuleBE_v2_AccountDB.query.custom(_EmptyQuery));
				await ModuleBE_v2_AccountDB.account.login(testCase.input.loginCredentials);
			});

			result = true;
		} catch (e: any) {
			if (!testCase.input.ignoreErrorWithText || !e.message.includes(testCase.input.ignoreErrorWithText))
				console.error(`${testCase.description} failed because: ${e.message}`);
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};

describe('Accounts - Login', () => {
	testSuiteTester(TestSuite_Accounts_Login);
});