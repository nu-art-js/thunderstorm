import {TestSuite_GetAdminBucket} from './getMainBucket';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_GetOrCreateBucket} from './getOrCreateBucket';

describe('Firebase Storage - Bucket Utils', () => {
	testSuiteTester(TestSuite_GetAdminBucket);
	testSuiteTester(TestSuite_GetOrCreateBucket);
});