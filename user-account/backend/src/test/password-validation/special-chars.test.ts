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

const assertionConfig_4_specialChars = {'special-chars': 4};
describe('Accounts - Password Validation - Enough Special Chars', () => {
	it('Enough Special Chars - Fail - #1', runTestCase({
		input: {
			password: '1234!@#',
			assertionConfig: assertionConfig_4_specialChars
		},
		result: {
			'special-chars': 'Password does not contain at least 4 special characters'
		}
	}));

	it('Enough Special Chars - Fail - #2', runTestCase({
		input: {
			password: '1!2@3#45',
			assertionConfig: assertionConfig_4_specialChars
		},
		result: {
			'special-chars': 'Password does not contain at least 4 special characters'
		}
	}));

	it('Enough Special Chars - Fail - #3', runTestCase({
		input: {
			password: 'a!b!@asd',
			assertionConfig: assertionConfig_4_specialChars
		},
		result: {
			'special-chars': 'Password does not contain at least 4 special characters'
		}
	}));

	it('Enough Special Chars - Fail - #4', runTestCase({
		input: {
			password: 'a1!b2@c3#d4',
			assertionConfig: assertionConfig_4_specialChars
		},
		result: {
			'special-chars': 'Password does not contain at least 4 special characters'
		}
	}));

	it('Enough Special Chars - Pass - #1', runTestCase({
		input: {
			password: '1234!@#$',
			assertionConfig: assertionConfig_4_specialChars
		},
		result: {}
	}));

	it('Enough Special Chars - Pass - #2', runTestCase({
		input: {
			password: '1!2@3#4$',
			assertionConfig: assertionConfig_4_specialChars
		},
		result: {}
	}));

	it('Enough Special Chars - Pass - #3', runTestCase({
		input: {
			password: 'a1!b2@c3#d4$e5%',
			assertionConfig: assertionConfig_4_specialChars
		},
		result: {}
	}));

	it('Enough Special Chars - Pass - #4', runTestCase({
		input: {
			password: 'a!b@c#d$',
			assertionConfig: assertionConfig_4_specialChars
		},
		result: {}
	}));
});