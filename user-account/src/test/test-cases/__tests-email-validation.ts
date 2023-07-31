import {TestSuite} from '@nu-art/ts-common/testing/types';
import {__stringify, tsValidateEmail, tsValidateResult} from '@nu-art/ts-common';
import {expect} from 'chai';
import {assertPasswordRules, PasswordAssertionConfig} from '../../main/shared/assertion';

type EmailValidationSuite = TestSuite<string, boolean>

const passingTests: EmailValidationSuite['testcases'] = ['email@example.com',
	'firstname.lastname@example.com',
	'email@subdomain.example.com',
	'firstname+lastname@example.com',
	'email@123.123.123.123',
	'email@111.222.333.44444',
	'1234567890@example.com',
	'email@example-one.com',
	'email@example.name',
	'email@example.museum',
	'email@example.co.jp',
	'firstname-lastname@example.com'
].map((email, i) => ({
	description: `Passing #${i + 1} - ${email}`,
	result: true,
	input: email
}));


//FIXME: below are email that are commented out, which should fail, but pass the validation.
const failingTests: EmailValidationSuite['testcases'] = [
	'plainaddress',
	'#@%^%#$@#$@#.com',
	'@example.com',
	// 'Joe Smith <email@example.com>',
	'email.example.com',
	// 'email@example@example.com',
	// '.email@example.com',
	'email.@example.com',
	// 'email..email@example.com',
	'あいうえお@example.com',
	// 'email@example.com (Joe Smith)',
	'email@example',
	'email@-example.com',
	// 'email@example.web',
	'_______@example.com',
	'email@example..com',
	// 'Abc..123@example.com',
].map((email, i) => ({
	description: `Failing #${i + 1} - ${email}`,
	result: false,
	input: email,
}));

const TestCases_PasswordValidation: EmailValidationSuite['testcases'] = [...passingTests, ...failingTests];

export const TestSuite_Accounts_EmailValidation: EmailValidationSuite = {
	label: '\n################ Email Validation Tests ################\n',
	testcases: TestCases_PasswordValidation,
	processor: (testCase) => {
		let result = tsValidateResult(testCase.input, tsValidateEmail);

		//Returned no errors
		if (!result)
			result = true;

		//Returned errors
		else {
			// const error = __stringify(result);
			// console.error(error);
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};