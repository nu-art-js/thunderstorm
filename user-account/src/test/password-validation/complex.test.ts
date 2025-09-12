import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {assertPasswordRules, PasswordAssertionConfig, PasswordFailureReport} from '../../main/index.js';


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

describe('Accounts - Password Validation - Complex', () => {
	it('Complex - Fail - #1', runTestCase({
		input: {
			password: '12#34!',
			assertionConfig: {
				'min-length': 5,
				'max-length': 8,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: {
			'capital-letters': 'Password does not contain at least 1 capital letters',
			'lower-case-letters': 'Password does not contain at least 1 lower case characters',
			'numbers': 'Password does not contain at least 5 numbers',
		}
	}));

	it('Complex - Fail - #2', runTestCase({
		input: {
			password: 'aBCD!',
			assertionConfig: {
				'min-length': 5,
				'max-length': 8,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: {
			'numbers': 'Password does not contain at least 5 numbers'
		}
	}));

	it('Complex - Fail - #3', runTestCase({
		input: {
			password: 'AaA123',
			assertionConfig: {
				'min-length': 5,
				'max-length': 8,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: {
			'numbers': 'Password does not contain at least 5 numbers',
			'special-chars': 'Password does not contain at least 1 special characters'
		}
	}));

	it('Complex - Fail - #4', runTestCase({
		input: {
			password: '123nBCD!@#$',
			assertionConfig: {
				'min-length': 5,
				'max-length': 8,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: {
			'max-length': 'Password is longer than 8 characters',
			'numbers': 'Password does not contain at least 5 numbers'
		}
	}));

	it('Complex - Pass - #1', runTestCase({
		input: {
			password: 'Aa!12345',
			assertionConfig: {
				'min-length': 5,
				'max-length': 10,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: {}
	}));

	it('Complex - Pass - #2', runTestCase({
		input: {
			password: 'abCD56!789',
			assertionConfig: {
				'min-length': 5,
				'max-length': 10,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: {}
	}));

	it('Complex - Pass - #3', runTestCase({
		input: {
			password: 'Pas!23456',
			assertionConfig: {
				'min-length': 5,
				'max-length': 10,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: {}
	}));

	it('Complex - Pass - #4', runTestCase({
		input: {
			password: '1234Ii!5',
			assertionConfig: {
				'min-length': 5,
				'max-length': 10,
				'lower-case-letters': 1,
				'capital-letters': 1,
				'numbers': 5,
				'special-chars': 1
			}
		},
		result: {}
	}));
});