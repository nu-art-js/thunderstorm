import {TestSuite} from '@nu-art/ts-common/testing/types';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {assertPasswordRules, PasswordAssertionConfig, PasswordFailureReport} from '../../main';


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

const assertionConfig_3_numbers = {'numbers': 3};
describe('Accounts - Password Validation - Enough Numbers', () => {
	it('Enough Numbers - Fail - #1', runTestCase({
		input: {
			password: '1asd',
			assertionConfig: assertionConfig_3_numbers
		},
		result: {
			numbers: 'Password does not contain at least 3 numbers'
		}
	}));

	it('Enough Numbers - Fail - #2', runTestCase({
		input: {
			password: 'abcdasd',
			assertionConfig: assertionConfig_3_numbers
		},
		result: {
			numbers: 'Password does not contain at least 3 numbers'
		}
	}));

	it('Enough Numbers - Fail - #3', runTestCase({
		input: {
			password: 'asda1',
			assertionConfig: assertionConfig_3_numbers
		},
		result: {
			numbers: 'Password does not contain at least 3 numbers'
		}
	}));

	it('Enough Numbers - Fail - #4', runTestCase({
		input: {
			password: 'asdasd12',
			assertionConfig: assertionConfig_3_numbers
		},
		result: {
			numbers: 'Password does not contain at least 3 numbers'
		}
	}));

	it('Enough Numbers - Pass - #1', runTestCase({
		input: {
			password: '12345',
			assertionConfig: assertionConfig_3_numbers
		},
		result: {}
	}));

	it('Enough Numbers - Pass - #2', runTestCase({
		input: {
			password: 'abcde123',
			assertionConfig: assertionConfig_3_numbers
		},
		result: {}
	}));

	it('Enough Numbers - Pass - #3', runTestCase({
		input: {
			password: '123a',
			assertionConfig: assertionConfig_3_numbers
		},
		result: {}
	}));

	it('Enough Numbers - Pass - #4', runTestCase({
		input: {
			password: 'a1b2c3d4',
			assertionConfig: assertionConfig_3_numbers
		},
		result: {}
	}));
});

