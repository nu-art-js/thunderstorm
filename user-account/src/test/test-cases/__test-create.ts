import '../_core/init';
import {MemKey_AccountEmail, ModuleBE_AccountDB} from '../../main/backend';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {Request_CreateAccount, Request_RegisterAccount} from '../../main';
import {PartialProperties} from '@nu-art/ts-common';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';


export type createInput = {
	withPassword: boolean,
	createCredentials: PartialProperties<Request_RegisterAccount, 'password' | 'passwordCheck'>
}

type CreateAccountTest = TestSuite<createInput, boolean>;

const TestCases_FB_Create: CreateAccountTest['testcases'] = [
	{
		description: 'Create With password',
		input: {
			withPassword: true,
			createCredentials: {email: 'test@email.com', password: '1234', passwordCheck: '1234', type: 'user'},
		},
		result: true
	},
	{
		description: 'Without password',
		input: {
			withPassword: false,
			createCredentials: {email: 'test@email.com', type: 'user'},
		},
		result: true
	},
	{
		description: 'Password without passwordCheck',
		input: {
			withPassword: true,
			createCredentials: {email: 'test@email.com', password: '1234', type: 'user'},
		},
		result: false
	},
	{
		description: 'passwordCheck without password',
		input: {
			withPassword: true,
			createCredentials: {email: 'test@email.com', passwordCheck: '1234', type: 'user'},
		},
		result: false
	},
];

export const TestSuite_Accounts_Create: CreateAccountTest = {
	label: 'Account Create test',
	testcases: TestCases_FB_Create,
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
				MemKey_AccountEmail.set('test');
				await ModuleBE_AccountDB.account[testCase.input.withPassword ? 'createWithPassword' : 'createWithoutPassword'](testCase.input.createCredentials as Request_RegisterAccount);
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

