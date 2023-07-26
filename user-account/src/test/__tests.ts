import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_Accounts_Register} from './__test-register';
import {TestSuite_Accounts_Login} from './__test-login';
import {TestSuite_Accounts_PasswordValidation} from './__tests-password-validation';

describe('Accounts - All Tests', () => {
	testSuiteTester(TestSuite_Accounts_PasswordValidation);
	testSuiteTester(TestSuite_Accounts_Register);
	testSuiteTester(TestSuite_Accounts_Login);
});