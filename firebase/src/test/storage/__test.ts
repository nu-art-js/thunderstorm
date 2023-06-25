import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_Storage_Write} from './write-to-files/write-to-files';
import {TestSuite_GetAdminBucket} from './bucket-utils/getMainBucket';
import {TestSuite_GetOrCreateBucket} from './bucket-utils/getOrCreateBucket';

describe('Firebase Storage - All Tests', () => {
	testSuiteTester(TestSuite_Storage_Write);
	testSuiteTester(TestSuite_GetAdminBucket);
	testSuiteTester(TestSuite_GetOrCreateBucket);
});