import {ModuleBE_v2_AccountDB} from '../../main/backend';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {RequestBody_CreateAccount} from '../../main';
import {PasswordAssertionConfig} from '../../main/shared/v2/assertion';
import {Exception, exists} from '@nu-art/ts-common';
import {expect} from 'chai';
import '../_core/consts';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export type registerAccountInput = {
	account: RequestBody_CreateAccount
	canRegister?: boolean
	assertionConfig?: PasswordAssertionConfig
	ignoreErrorWithText?: string;
}

type RegisterAccountTest = TestSuite<registerAccountInput, boolean>;

const tooShortCases: RegisterAccountTest['testcases'] = [
	...['1234', 'abcd', '12ab', '1a'].map((input, i) => ({
			description: `Too Short p/w - Fail - #${i + 1}`,
			result: false,
			input: {
				account: {email: 'test@email.com', password: input, password_check: input},
				assertionConfig: {'min-length': 5},
				ignoreErrorWithText: 'input has less than'
			},
		})
	),
	...['12345', 'abcde', '123abc', 'dsfghjknlm'].map((input, i) => ({
		description: `Too Short p/w - Pass - #${i + 1}`,
		result: true,
		input: {
			account: {email: 'test@email.com', password: input, password_check: input},
			assertionConfig: {'min-length': 5},
		}
	}))
];

const tooLongCases: RegisterAccountTest['testcases'] = [
	...['123456', 'abcdasd', 'asdasdasd', '123123asdasd'].map((input, i) => ({
			description: `Too long p/w - Fail - #${i + 1}`,
			result: false,
			input: {
				account: {email: 'test@email.com', password: input, password_check: input},
				assertionConfig: {'max-length': 5},
				ignoreErrorWithText: 'input is longer than'
			},
		})
	),
	...['12345', 'abcde', '123a', 'asd'].map((input, i) => ({
		description: `Too long p/w - Pass - #${i + 1}`,
		result: true,
		input: {
			account: {email: 'test@email.com', password: input, password_check: input},
			assertionConfig: {'max-length': 5},
		}
	}))
];

const enoughNumbersCases: RegisterAccountTest['testcases'] = [
	...['1asd', 'abcdasd', 'asda1', 'asdasd12'].map((input, i) => ({
			description: `Enough Numbers - Fail - #${i + 1}`,
			result: false,
			input: {
				account: {email: 'test@email.com', password: input, password_check: input},
				assertionConfig: {numbers: 3},
				ignoreErrorWithText: 'regexp: /.*?[0-9].*?[0-9].*?[0-9]/'
			},
		})
	),
	...['12345', 'abcde123', '123a', 'a1b2c3d4'].map((input, i) => ({
		description: `Enough Numbers - Pass - #${i + 1}`,
		result: true,
		input: {
			account: {email: 'test@email.com', password: input, password_check: input},
			assertionConfig: {numbers: 3}
		}
	}))
];

const specialCharsCases: RegisterAccountTest['testcases'] = [
	...['1234!@#', '1!2@3#45', 'a!b!@asd', 'a1!b2@c3#d4'].map((input, i) => ({
			description: `Enough Special Chars - Fail - #${i + 1}`,
			result: false,
			input: {
				account: {email: 'test@email.com', password: input, password_check: input},
				assertionConfig: {'special-chars': 4},
				ignoreErrorWithText: 'regexp: /.*?[!@#$%^&*()_\\\\+\\\\-=\\\\[\\\\]{},.\\\\/;\':\\"<> |\\\\\\\\].*?[!@#$%^&*()_\\\\+\\\\-=\\\\[\\\\]{},.\\\\/;\':\\"<> |\\\\\\\\].*?[!@#$%^&*()_\\\\+\\\\-=\\\\[\\\\]{},.\\\\/;\':\\"<> |\\\\\\\\].*?[!@#$%^&*()_\\\\+\\\\-=\\\\[\\\\]{},.\\\\/;\':\\"<> |\\\\\\\\]/'
			},
		})
	),
	...['1234!@#$', '1!2@3#4$', 'a1!b2@c3#d4$e5%', 'a!b@c#d$'].map((input, i) => ({
		description: `Enough Special Chars - Pass - #${i + 1}`,
		result: true,
		input: {
			account: {email: 'test@email.com', password: input, password_check: input},
			assertionConfig: {'special-chars': 4}
		}
	}))
];

const enoughCapitalLettersCases: RegisterAccountTest['testcases'] = [
	...['12#34!', 'aAcCdDasd', 'aAsdaA1', 'asdasd12'].map((input, i) => ({
			description: `Enough Capital Letters - Fail - #${i + 1}`,
			result: false,
			input: {
				account: {email: 'test@email.com', password: input, password_check: input},
				assertionConfig: {'capital-letters': 4},
				ignoreErrorWithText: 'regexp: /.*?[A-Z].*?[A-Z].*?[A-Z].*?[A-Z]/'
			},
		})
	),
	...['ABCDE12#34!', 'aAbBcCdDe123', 'AA123aAAA', 'aAA1b2cCC3dDD4'].map((input, i) => ({
		description: `Enough Capital Letters - Pass - #${i + 1}`,
		result: true,
		input: {
			account: {email: 'test@email.com', password: input, password_check: input},
			assertionConfig: {'capital-letters': 4}
		}
	}))
];

const enoughLowerLettersCases: RegisterAccountTest['testcases'] = [
	...['12#34!', 'aBCD', 'AaA123', '123nBCD'].map((input, i) => ({
			description: `Enough Lower Case Letters - Fail - #${i + 1}`,
			result: false,
			input: {
				account: {email: 'test@email.com', password: input, password_check: input},
				assertionConfig: {'lower-case-letters': 2},
				ignoreErrorWithText: 'regexp: /.*?[a-z].*?[a-z]/'
			},
		})
	),
	...['abcde12#34!', 'abCDEfGhI', 'AA123abcdAAA', 'aAA1b2cCC3dDD4'].map((input, i) => ({
		description: `Enough Lower Case Letters - Pass - #${i + 1}`,
		result: true,
		input: {
			account: {email: 'test@email.com', password: input, password_check: input},
			assertionConfig: {'lower-case-letters': 4}
		}
	}))
];

const complexCases: RegisterAccountTest['testcases'] = [
	...['12#34!', 'aBCD!', 'AaA123', '123nBCD!@#$'].map((password, i) => ({
			description: `Complex - Fail - #${i + 1}`,
			result: false,
			input: {
				account: {email: 'test@email.com', password: password, password_check: password},
				assertionConfig: {
					'min-length': 5,
					'max-length': 8,
					'lower-case-letters': 1,
					'capital-letters': 1,
					'numbers': 5,
					'special-chars': 1
				},
				ignoreErrorWithText: 'regexp: /.*?[a-z].*?[a-z]/'
			},
		})
	),
	...['Aa!12345', 'abCD56!789', 'Pas!23456', '1234Ii!5'].map((password, i) => ({
		description: `Complex - Pass - #${i + 1}`,
		result: true,
		input: {
			account: {email: 'test@email.com', password: password, password_check: password},
			assertionConfig: {
				'min-length': 5,
				'max-length': 10,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		}
	}))
];

const TestCases_FB_Register: RegisterAccountTest['testcases'] = [
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
	...tooShortCases,
	...tooLongCases,
	...enoughNumbersCases,
	...specialCharsCases,
	...enoughCapitalLettersCases,
	...enoughLowerLettersCases,
	...complexCases,
];

TestCases_FB_Register.forEach(testCase => testCase.description = `${testCase.description}: ${testCase.input.account.email} - ${testCase.input.account.password}`);
export const TestSuite_Accounts_Register: RegisterAccountTest = {
	label: 'Account register test',
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
			if (!testCase.input.ignoreErrorWithText || !(e as Exception).message.includes(testCase.input.ignoreErrorWithText))
				console.error(`${testCase.description} failed because: ${e.message}`);
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};