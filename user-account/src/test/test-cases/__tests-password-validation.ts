import {TestSuite} from '@nu-art/ts-common/testing/types';
import {__stringify} from '@nu-art/ts-common';
import {expect} from 'chai';
import {assertPasswordRules, PasswordAssertionConfig} from '../../main/shared/v2/assertion';

type PasswordValidationInput = {
	password: string;
	assertionConfig?: PasswordAssertionConfig;
	ignoreErrorWithText?: string;
}

type PasswordValidationSuite = TestSuite<PasswordValidationInput, boolean>

const tooShortCases: PasswordValidationSuite['testcases'] = [
	...['1234', 'abcd', '12ab', '1a'].map((password, i) => ({
			description: `Too Short p/w - Fail - #${i + 1}`,
			result: false,
			input: {
				password,
				assertionConfig: {'min-length': 5},
				ignoreErrorWithText: 'input has less than'
			},
		})
	),
	...['12345', 'abcde', '123abc', 'dsfghjknlm'].map((password, i) => ({
		description: `Too Short p/w - Pass - #${i + 1}`,
		result: true,
		input: {
			password,
			assertionConfig: {'min-length': 5},
		}
	}))
];

const tooLongCases: PasswordValidationSuite['testcases'] = [
	...['123456', 'abcdasd', 'asdasdasd', '123123asdasd'].map((password, i) => ({
			description: `Too long p/w - Fail - #${i + 1}`,
			result: false,
			input: {
				password,
				assertionConfig: {'max-length': 5},
				ignoreErrorWithText: 'input is longer than'
			},
		})
	),
	...['12345', 'abcde', '123a', 'asd'].map((password, i) => ({
		description: `Too long p/w - Pass - #${i + 1}`,
		result: true,
		input: {
			password,
			assertionConfig: {'max-length': 5},
		}
	}))
];

const enoughNumbersCases: PasswordValidationSuite['testcases'] = [
	...['1asd', 'abcdasd', 'asda1', 'asdasd12'].map((password, i) => ({
			description: `Enough Numbers - Fail - #${i + 1}`,
			result: false,
			input: {
				password,
				assertionConfig: {numbers: 3},
				ignoreErrorWithText: 'regexp: /.*?[0-9].*?[0-9].*?[0-9]/'
			},
		})
	),
	...['12345', 'abcde123', '123a', 'a1b2c3d4'].map((password, i) => ({
		description: `Enough Numbers - Pass - #${i + 1}`,
		result: true,
		input: {
			password,
			assertionConfig: {numbers: 3}
		}
	}))
];

const specialCharsCases: PasswordValidationSuite['testcases'] = [
	...['1234!@#', '1!2@3#45', 'a!b!@asd', 'a1!b2@c3#d4'].map((password, i) => ({
			description: `Enough Special Chars - Fail - #${i + 1}`,
			result: false,
			input: {
				password,
				assertionConfig: {'special-chars': 4},
				ignoreErrorWithText: 'regexp: /.*?[!@#$%^&*()_\\\\+\\\\-=\\\\[\\\\]{},.\\\\/;\':\\"<> |\\\\\\\\].*?[!@#$%^&*()_\\\\+\\\\-=\\\\[\\\\]{},.\\\\/;\':\\"<> |\\\\\\\\].*?[!@#$%^&*()_\\\\+\\\\-=\\\\[\\\\]{},.\\\\/;\':\\"<> |\\\\\\\\].*?[!@#$%^&*()_\\\\+\\\\-=\\\\[\\\\]{},.\\\\/;\':\\"<> |\\\\\\\\]/'
			},
		})
	),
	...['1234!@#$', '1!2@3#4$', 'a1!b2@c3#d4$e5%', 'a!b@c#d$'].map((password, i) => ({
		description: `Enough Special Chars - Pass - #${i + 1}`,
		result: true,
		input: {
			password,
			assertionConfig: {'special-chars': 4}
		}
	}))
];

const enoughCapitalLettersCases: PasswordValidationSuite['testcases'] = [
	...['12#34!', 'aAcCdDasd', 'aAsdaA1', 'asdasd12'].map((password, i) => ({
			description: `Enough Capital Letters - Fail - #${i + 1}`,
			result: false,
			input: {
				password,
				assertionConfig: {'capital-letters': 4},
				ignoreErrorWithText: 'regexp: /.*?[A-Z].*?[A-Z].*?[A-Z].*?[A-Z]/'
			},
		})
	),
	...['ABCDE12#34!', 'aAbBcCdDe123', 'AA123aAAA', 'aAA1b2cCC3dDD4'].map((password, i) => ({
		description: `Enough Capital Letters - Pass - #${i + 1}`,
		result: true,
		input: {
			password,
			assertionConfig: {'capital-letters': 4}
		}
	}))
];

const enoughLowerLettersCases: PasswordValidationSuite['testcases'] = [
	...['12#34!', 'aBCD', 'AaA123', '123nBCD'].map((password, i) => ({
			description: `Enough Lower Case Letters - Fail - #${i + 1}`,
			result: false,
			input: {
				password,
				assertionConfig: {'lower-case-letters': 2},
				ignoreErrorWithText: 'regexp: /.*?[a-z].*?[a-z]/'
			},
		})
	),
	...['abcde12#34!', 'abCDEfGhI', 'AA123abcdAAA', 'aAA1b2cCC3dDD4'].map((password, i) => ({
		description: `Enough Lower Case Letters - Pass - #${i + 1}`,
		result: true,
		input: {
			password,
			assertionConfig: {'lower-case-letters': 4}
		}
	}))
];

const complexCases: PasswordValidationSuite['testcases'] = [
	...['12#34!', 'aBCD!', 'AaA123', '123nBCD!@#$'].map((password, i) => ({
			description: `Complex - Fail - #${i + 1}`,
			result: false,
			input: {
				password,
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
			password,
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

const TestCases_PasswordValidation: PasswordValidationSuite['testcases'] = [
	{
		description: 'Simple',
		input: {password: '1234'},
		result: true
	},
	{
		description: 'Simple with Assertion',
		input: {
			password: '1234',
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

export const TestSuite_Accounts_PasswordValidation: PasswordValidationSuite = {
	label: '\n################ Password Validation Tests ################\n',
	testcases: TestCases_PasswordValidation,
	processor: (testCase) => {
		let result = assertPasswordRules(testCase.input.password, testCase.input.assertionConfig);

		//Returned no errors
		if (!result)
			result = true;

		//Returned errors
		else {
			// const error = __stringify(result);
			// if (!testCase.input.ignoreErrorWithText || !error.includes(testCase.input.ignoreErrorWithText))
			// 	console.error(error);
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};