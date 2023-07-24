import {ModuleBE_v2_AccountDB} from '../../main/backend';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {RequestBody_CreateAccount} from '../../main';
import {PasswordAssertionConfig} from '../../main/shared/v2/assertion';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {exists} from '@nu-art/ts-common';
import {expect} from 'chai';


export type CreateAccountInput = {
	account: RequestBody_CreateAccount
	canRegister?: boolean
	assertionConfig?: PasswordAssertionConfig
}

type CreateAccountTest = TestSuite<CreateAccountInput, boolean>;
import '../_core/consts';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


const TestCases_FB_Create: CreateAccountTest['testcases'] = [{
	description: 'Simple',
	input: {account: {email: 'test@email.com', password: '1234', password_check: '1234'}},
	result: true
}];

TestCases_FB_Create.forEach(testCase => testCase.description = `${testCase.description}: ${testCase.input.account.email} - ${testCase.input.account.password}`);
export const TestSuite_Accounts_Create: CreateAccountTest = {
	label: 'Accounts create test',
	testcases: TestCases_FB_Create,
	processor: async (testCase) => {
		ModuleBE_v2_AccountDB.setDefaultConfig({
			canRegister: exists(testCase.input.canRegister) ? testCase.input.canRegister : true,
			passwordAssertion: testCase.input.assertionConfig
		});

		let result: boolean | undefined;
		try {




			await new MemStorage().init(() => ModuleBE_v2_AccountDB.createAccount({email: 'test@email.com', password: '1234', password_check: '1234'}));
			// await ModuleBE_v2_AccountDB.createAccount({email: 'test@email.com', password: '1234', password_check: '1234'});
			result = true;
		} catch (e) {
			console.error(e);
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};

describe('Accounts - Create', () => {
	testSuiteTester(TestSuite_Accounts_Create);
});