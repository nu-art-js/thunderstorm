import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_Permissions_BasicSetup} from './__test-project';

describe('Firestore v2 - All Tests', () => {
	testSuiteTester(TestSuite_Permissions_BasicSetup);
});