import {Account_Login, Request_RegisterAccount} from '../../main';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {ModuleBE_AccountDB} from '../../main/backend';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {expect} from 'chai';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {generateHex} from '@nu-art/ts-common';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';


export type loginInput = {
	registerCredentials: Request_RegisterAccount
	loginCredentials: Account_Login['request']
	ignoreErrorWithText?: string
}

type LoginAccountTest = TestSuite<loginInput, boolean>;
const deviceId = generateHex(32);

const TestCases_FB_Login: LoginAccountTest['testcases'] = [
	{
		description: 'Login Pass',
		input: {
			registerCredentials: {email: 'test@email.com', password: '1234', passwordCheck: '1234', type: 'user', deviceId},
			loginCredentials: {email: 'test@email.com', password: '1234', deviceId}
		},
		result: true
	},
	{
		description: 'Login Fail - Email',
		input: {
			registerCredentials: {email: 'test@email.com', password: '1234', passwordCheck: '1234', type: 'user', deviceId},
			loginCredentials: {email: 'test1@email.com', password: '12344', deviceId},
			ignoreErrorWithText: 'Could not find Account with unique query'
		},
		result: false
	},
	{
		description: 'Login Fail - Password',
		input: {
			registerCredentials: {email: 'test@email.com', password: '1234', passwordCheck: '1234', type: 'user', deviceId},
			loginCredentials: {email: 'test@email.com', password: '12345', deviceId},
			ignoreErrorWithText: 'Wrong username or password',
		},
		result: false
	},
];

export const TestSuite_Accounts_Login: LoginAccountTest = {
	label: '\n################ Account Login Tests ################\n',
	testcases: TestCases_FB_Login,
	processor: async (testCase) => {
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
		// // @ts-ignore // debug only
		// console.log(ModuleBE_AccountDB.config); // debug only

		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		let result: boolean | undefined;
		try {
			await new MemStorage().init(async () => {
				MemKey_HttpResponse.set({
					setHeader: () => {

					}
				} as any);

				await ModuleBE_AccountDB.account.register(testCase.input.registerCredentials);
			});
			await new MemStorage().init(async () => {
				// console.log(await ModuleBE_AccountDB.query.custom(_EmptyQuery));
				await ModuleBE_AccountDB.account.login(testCase.input.loginCredentials);
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