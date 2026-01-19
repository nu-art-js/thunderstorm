import {TestSuite_GetAdminBucket} from './getMainBucket.js';
import {testSuiteTester} from '@nu-art/testalot';
import {TestSuite_GetOrCreateBucket} from './getOrCreateBucket.js';

describe('Firebase Storage - Bucket Utils', () => {
	testSuiteTester(TestSuite_GetAdminBucket);
	testSuiteTester(TestSuite_GetOrCreateBucket);
});