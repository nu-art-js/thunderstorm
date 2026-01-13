import {TestSuite} from '@nu-art/testalot';
import {tsValidateEmail, tsValidateResult} from '@nu-art/ts-common';
import {runSingleTestCase} from '@nu-art/testalot';

type EmailValidationInput = string;
type EmailValidationSuite = TestSuite<EmailValidationInput, boolean>;
type TestCase_EmailValidation = EmailValidationSuite['testcases'][number];

const test = async (input: EmailValidationInput): Promise<boolean> => {
	const result = tsValidateResult(input, tsValidateEmail);
	return !result;
};

const runTestCase = (testCase: TestCase_EmailValidation) => () => runSingleTestCase(test, testCase);

describe('Accounts - Email Validation', () => {
	// Passing tests

	it('Passing #1 - email@example.com', runTestCase({
		input: 'email@example.com',
		result: true
	}));

	it('Passing #2 - firstname.lastname@example.com', runTestCase({
		input: 'firstname.lastname@example.com',
		result: true
	}));

	it('Passing #3 - email@subdomain.example.com', runTestCase({
		input: 'email@subdomain.example.com',
		result: true
	}));

	it('Passing #4 - firstname+lastname@example.com', runTestCase({
		input: 'firstname+lastname@example.com',
		result: true
	}));

	it('Passing #5 - email@123.123.123.123', runTestCase({
		input: 'email@123.123.123.123',
		result: true
	}));

	it('Passing #6 - email@111.222.333.44444', runTestCase({
		input: 'email@111.222.333.44444',
		result: true
	}));

	it('Passing #7 - 1234567890@example.com', runTestCase({
		input: '1234567890@example.com',
		result: true
	}));

	it('Passing #8 - email@example-one.com', runTestCase({
		input: 'email@example-one.com',
		result: true
	}));

	it('Passing #9 - email@example.name', runTestCase({
		input: 'email@example.name',
		result: true
	}));

	it('Passing #10 - email@example.museum', runTestCase({
		input: 'email@example.museum',
		result: true
	}));

	it('Passing #11 - email@example.co.jp', runTestCase({
		input: 'email@example.co.jp',
		result: true
	}));

	it('Passing #12 - firstname-lastname@example.com', runTestCase({
		input: 'firstname-lastname@example.com',
		result: true
	}));

	it('Failing #1 - plainaddress', runTestCase({
		input: 'plainaddress',
		result: false
	}));

	it('Failing #2 - #@%^%#$@#$@#.com', runTestCase({
		input: '#@%^%#$@#$@#.com',
		result: false
	}));

	it('Failing #3 - @example.com', runTestCase({
		input: '@example.com',
		result: false
	}));

	it('Failing #4 - email.example.com', runTestCase({
		input: 'email.example.com',
		result: false
	}));

	it('Failing #5 - email.@example.com', runTestCase({
		input: 'email.@example.com',
		result: false
	}));

	it('Failing #6 - あいうえお@example.com', runTestCase({
		input: 'あいうえお@example.com',
		result: false
	}));

	it('Failing #7 - email@example', runTestCase({
		input: 'email@example',
		result: false
	}));

	it('Failing #8 - email@-example.com', runTestCase({
		input: 'email@-example.com',
		result: false
	}));

	it('Failing #9 - _______@example.com', runTestCase({
		input: '_______@example.com',
		result: false
	}));

	it('Failing #10 - email@example..com', runTestCase({
		input: 'email@example..com',
		result: false
	}));
});
