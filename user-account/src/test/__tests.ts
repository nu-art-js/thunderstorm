import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_Accounts_Register} from './register/__test';
import {TestSuite_Accounts_Login} from './login/__test';

describe('Accounts - All Tests', () => {
	testSuiteTester(TestSuite_Accounts_Register);
	// testSuiteTester(TestSuite_Accounts_Login);

});