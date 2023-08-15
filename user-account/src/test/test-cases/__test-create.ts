import '../_core/init';
import {MemKey_AccountEmail, ModuleBE_v2_AccountDB} from '../../main/backend';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {Request_CreateAccount} from '../../main';
import {PartialProperties} from '@nu-art/ts-common';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';


export type createInput = {
	createCredentials: PartialProperties<Request_CreateAccount, 'password' | 'password_check'>
}

type CreateAccountTest = TestSuite<createInput, boolean>;

const TestCases_FB_Create: CreateAccountTest['testcases'] = [
	{
		description: 'With password',
		input: {
			createCredentials: {email: 'test@email.com', password: '1234', password_check: '1234', type: 'user'},
		},
		result: true
	},
	{
		description: 'Without password',
		input: {
			createCredentials: {email: 'test@email.com', type: 'user'},
		},
		result: true
	},
	{
		description: 'Password without password_check',
		input: {
			createCredentials: {email: 'test@email.com', password: '1234', type: 'user'},
		},
		result: false
	},
	{
		description: 'Password_check without password',
		input: {
			createCredentials: {email: 'test@email.com', password_check: '1234', type: 'user'},
		},
		result: false
	},
];

export const TestSuite_Accounts_Create: CreateAccountTest = {
	label: 'Account Create test',
	testcases: TestCases_FB_Create,
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
				MemKey_AccountEmail.set('test');
				await ModuleBE_v2_AccountDB.account.create(testCase.input.createCredentials);
			});

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

