import {ModuleBE_v2_AccountDB} from '../../main/backend';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {Request_CreateAccount} from '../../main';
import {expect} from 'chai';
import '../_core/consts';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {_EmptyQuery} from '@nu-art/db-api-generator';


export type loginInput = {
	credentials: Request_CreateAccount
}

type RegisterAccountTest = TestSuite<loginInput, boolean>;


const TestCases_FB_Register: RegisterAccountTest['testcases'] = [
	{
		description: 'Simple',
		input: {credentials: {email: 'test@email.com', password: '1234', password_check: '1234'}},
		result: true
	},
];

TestCases_FB_Register.forEach(testCase => testCase.description = `${testCase.description}: ${testCase.input.credentials.email} - ${testCase.input.credentials.password}`);
export const TestSuite_Accounts_Login: RegisterAccountTest = {
	label: 'Account login test',
	testcases: TestCases_FB_Register,
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
				await ModuleBE_v2_AccountDB.account.register(testCase.input.credentials);
				console.log(await ModuleBE_v2_AccountDB.query.custom(_EmptyQuery));
				await ModuleBE_v2_AccountDB.account.login(testCase.input.credentials);
			});
			result = true;
		} catch (e: any) {
			console.error(`${testCase.description} failed because: ${e.message}`);
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};