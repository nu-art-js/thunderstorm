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

const assertionConfig_4_uppercase = {'capital-letters': 4};
describe('Accounts - Password Validation - Enough Capital Letters', () => {
	it('Enough Capital Letters - Fail - #1', runTestCase({
		input: {
			password: '12#34!',
			assertionConfig: assertionConfig_4_uppercase,
		},
		result: {
			'capital-letters': 'Password does not contain at least 4 capital letters'
		}
	}));

	it('Enough Capital Letters - Fail - #2', runTestCase({
		input: {
			password: 'aAcCdDasd',
			assertionConfig: assertionConfig_4_uppercase,
		},
		result: {
			'capital-letters': 'Password does not contain at least 4 capital letters'
		}
	}));

	it('Enough Capital Letters - Fail - #3', runTestCase({
		input: {
			password: 'aAsdaA1',
			assertionConfig: assertionConfig_4_uppercase,
		},
		result: {
			'capital-letters': 'Password does not contain at least 4 capital letters'
		}
	}));

	it('Enough Capital Letters - Fail - #4', runTestCase({
		input: {
			password: 'asdasd12',
			assertionConfig: assertionConfig_4_uppercase,
		},
		result: {
			'capital-letters': 'Password does not contain at least 4 capital letters'
		}
	}));

	it('Enough Capital Letters - Pass - #1', runTestCase({
		input: {
			password: 'ABCDE12#34!',
			assertionConfig: assertionConfig_4_uppercase
		},
		result: {}
	}));

	it('Enough Capital Letters - Pass - #2', runTestCase({
		input: {
			password: 'aAbBcCdDe123',
			assertionConfig: assertionConfig_4_uppercase
		},
		result: {}
	}));

	it('Enough Capital Letters - Pass - #3', runTestCase({
		input: {
			password: 'AA123aAAA',
			assertionConfig: assertionConfig_4_uppercase
		},
		result: {}
	}));

	it('Enough Capital Letters - Pass - #4', runTestCase({
		input: {
			password: 'aAA1b2cCC3dDD4',
			assertionConfig: assertionConfig_4_uppercase
		},
		result: {}
	}));
});
