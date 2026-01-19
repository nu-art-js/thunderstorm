import {TestSuite} from '@nu-art/testalot';
import {runSingleTestCase} from '@nu-art/testalot';
import {assertPasswordRules, PasswordAssertionConfig, PasswordFailureReport} from '@nu-art/user-account-shared';


type PasswordValidationInput = {
	password: string;
	assertionConfig?: PasswordAssertionConfig;
	ignoreErrorWithText?: string;
}

type PasswordValidationSuite = TestSuite<PasswordValidationInput, undefined | PasswordFailureReport | boolean>


export type TestCase_PasswordValidation = PasswordValidationSuite['testcases'][number];

const test = async (input: PasswordValidationInput) => {
	return assertPasswordRules(input.password, input.assertionConfig) ?? {};
};

const runTestCase = (testCase: TestCase_PasswordValidation) => () => runSingleTestCase(test, testCase);

const assertionConfig_2_lowercase = {'lower-case-letters': 2};
const assertionConfig_4_lowercase = {'lower-case-letters': 4};
describe('Accounts - Password Validation - Enough Lower Case Letters', () => {
	it('Enough Lower Case Letters - Fail - #1', runTestCase({
		input: {
			password: '12#34!',
			assertionConfig: assertionConfig_2_lowercase,
		},
		result: {
			'lower-case-letters': 'Password does not contain at least 2 lower case characters'
		}
	}));

	it('Enough Lower Case Letters - Fail - #2', runTestCase({
		input: {
			password: 'aBCD',
			assertionConfig: assertionConfig_2_lowercase,
		},
		result: {
			'lower-case-letters': 'Password does not contain at least 2 lower case characters'
		}
	}));

	it('Enough Lower Case Letters - Fail - #3', runTestCase({
		input: {
			password: 'AaA123',
			assertionConfig: assertionConfig_2_lowercase,
		},
		result: {
			'lower-case-letters': 'Password does not contain at least 2 lower case characters'
		}
	}));

	it('Enough Lower Case Letters - Fail - #4', runTestCase({
		input: {
			password: '123nBCD',
			assertionConfig: assertionConfig_2_lowercase,
		},
		result: {
			'lower-case-letters': 'Password does not contain at least 2 lower case characters'
		}
	}));

	it('Enough Lower Case Letters - Pass - #1', runTestCase({
		input: {
			password: 'abcde12#34!',
			assertionConfig: assertionConfig_4_lowercase
		},
		result: {}
	}));

	it('Enough Lower Case Letters - Pass - #2', runTestCase({
		input: {
			password: 'abCDEfGhI',
			assertionConfig: assertionConfig_4_lowercase
		},
		result: {}
	}));

	it('Enough Lower Case Letters - Pass - #3', runTestCase({
		input: {
			password: 'AA123abcdAAA',
			assertionConfig: assertionConfig_4_lowercase
		},
		result: {}
	}));

	it('Enough Lower Case Letters - Pass - #4', runTestCase({
		input: {
			password: 'aAA1b2cCC3dDD4',
			assertionConfig: assertionConfig_4_lowercase
		},
		result: {}
	}));
});