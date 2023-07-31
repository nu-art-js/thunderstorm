import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_Accounts_PasswordValidation} from './test-cases/__tests-password-validation';
import {TestSuite_Accounts_Register} from './test-cases/__test-register';
import {TestSuite_Accounts_Login} from './test-cases/__test-login';
import {TestSuite_Accounts_EmailValidation} from './test-cases/__tests-email-validation';
import {TestSuite_Accounts_Create} from './test-cases/__test-create';
import './_core/consts';


describe('Accounts - All Tests', () => {
	// testSuiteTester(TestSuite_Accounts_PasswordValidation);
	// testSuiteTester(TestSuite_Accounts_EmailValidation);
	// testSuiteTester(TestSuite_Accounts_Register);
	testSuiteTester(TestSuite_Accounts_Create);
	// testSuiteTester(TestSuite_Accounts_Login);
});