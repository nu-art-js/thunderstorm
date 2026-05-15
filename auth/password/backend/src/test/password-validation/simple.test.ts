import {TestSuite} from '@nu-art/testalot';
import {runSingleTestCase} from '@nu-art/testalot';
import {assertPasswordRules, PasswordAssertionConfig, PasswordFailureReport} from '@nu-art/password-auth-shared';


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

describe('Accounts - Password Validation - Simple', () => {
	it('Simple', runTestCase({
		description: 'Simple',
		input: {password: '1234'},
		result: {}
	}));

	it('Simple with Assertion', runTestCase({
		description: 'Simple with Assertion',
		input: {
			password: '1234',
			assertionConfig: {'min-length': 0, 'max-length': 5}
		},
		result: {}
	}));

});
