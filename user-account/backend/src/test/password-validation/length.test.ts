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

const assertionConfig_minLength_5Chars = {'min-length': 5};
const assertionConfig_maxLength_5Chars = {'max-length': 5};

describe('Accounts - Password Validation - length', () => {
	it('Too Short p/w - Fail - #1', runTestCase({
		input: {
			password: '1234',
			assertionConfig: assertionConfig_minLength_5Chars,
		},
		result: {
			'min-length': 'Password is shorter than 5 characters'
		}
	}));

	it('Too Short p/w - Fail - #2', runTestCase({
		input: {
			password: 'abcd',
			assertionConfig: assertionConfig_minLength_5Chars,
		},
		result: {
			'min-length': 'Password is shorter than 5 characters'
		}
	}));

	it('Too Short p/w - Fail - #3', runTestCase({
		input: {
			password: '12ab',
			assertionConfig: assertionConfig_minLength_5Chars,
		},
		result: {
			'min-length': 'Password is shorter than 5 characters'
		}
	}));

	it('Too Short p/w - Fail - #4', runTestCase({
		input: {
			password: '1a',
			assertionConfig: assertionConfig_minLength_5Chars,
		},
		result: {
			'min-length': 'Password is shorter than 5 characters'
		}
	}));

	it('Too Short p/w - Pass - #1', runTestCase({
		input: {
			password: '12345',
			assertionConfig: assertionConfig_minLength_5Chars,
		},
		result: {}
	}));

	it('Too Short p/w - Pass - #2', runTestCase({
		input: {
			password: 'abcde',
			assertionConfig: assertionConfig_minLength_5Chars,
		},
		result: {}
	}));

	it('Too Short p/w - Pass - #3', runTestCase({
		input: {
			password: '123abc',
			assertionConfig: assertionConfig_minLength_5Chars,
		},
		result: {}
	}));

	it('Too Short p/w - Pass - #4', runTestCase({
		input: {
			password: 'dsfghjknlm',
			assertionConfig: assertionConfig_minLength_5Chars,
		},
		result: {}
	}));

	it('Too long p/w - Fail - #1', runTestCase({
		input: {
			password: '123456',
			assertionConfig: assertionConfig_maxLength_5Chars
		},
		result: {
			'max-length': 'Password is longer than 5 characters'
		}
	}));

	it('Too long p/w - Fail - #2', runTestCase({
		input: {
			password: 'abcdasd',
			assertionConfig: assertionConfig_maxLength_5Chars
		},
		result: {
			'max-length': 'Password is longer than 5 characters'
		}
	}));

	it('Too long p/w - Fail - #3', runTestCase({
		input: {
			password: 'asdasdasd',
			assertionConfig: assertionConfig_maxLength_5Chars
		},
		result: {
			'max-length': 'Password is longer than 5 characters'
		}
	}));

	it('Too long p/w - Fail - #4', runTestCase({
		input: {
			password: '123123asdasd',
			assertionConfig: assertionConfig_maxLength_5Chars
		},
		result: {
			'max-length': 'Password is longer than 5 characters'
		}
	}));

	it('Too long p/w - Pass - #1', runTestCase({
		input: {
			password: '12345',
			assertionConfig: assertionConfig_maxLength_5Chars
		},
		result: {}
	}));

	it('Too long p/w - Pass - #2', runTestCase({
		input: {
			password: 'abcde',
			assertionConfig: assertionConfig_maxLength_5Chars
		},
		result: {}
	}));

	it('Too long p/w - Pass - #3', runTestCase({
		input: {
			password: '123a',
			assertionConfig: assertionConfig_maxLength_5Chars
		},
		result: {}
	}));

	it('Too long p/w - Pass - #4', runTestCase({
		input: {
			password: 'asd',
			assertionConfig: assertionConfig_maxLength_5Chars
		},
		result: {}
	}));
});