import {ModuleBE_v2_AccountDB} from '../../main/backend';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {Request_CreateAccount, Request_LoginAccount} from '../../main';
import {expect} from 'chai';
import '../_core/consts';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export type loginInput = {
	registerCredentials: Request_CreateAccount
	loginCredentials: Request_LoginAccount
}

type LoginAccountTest = TestSuite<loginInput, boolean>;


const TestCases_FB_Login: LoginAccountTest['testcases'] = [
	{
		description: 'Simple',
		input: {
			registerCredentials: {email: 'test@email.com', password: '1234', password_check: '1234'},
			loginCredentials: {email: 'test@email.com', password: '1234'}
		},
		result: true
	},
	{
		description: 'Bad Password',
		input: {
			registerCredentials: {email: 'test@email.com', password: '1234', password_check: '1234'},
			loginCredentials: {email: 'test@email.com', password: '12345'}
		},
		result: false
	},
];

export const TestSuite_Accounts_Login: LoginAccountTest = {
	label: 'Account login test',
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
			console.error(`${testCase.description} failed because: ${e.message}`);
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};