import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_Storage_Write} from './write-to-files/write-to-files';
import {TestSuite_GetAdminBucket} from './bucket-utils/getMainBucket';
import {TestSuite_GetOrCreateBucket} from './bucket-utils/getOrCreateBucket';
import {TestSuite_FileDelete} from './delete-file/file-delete';
import {TestSuite_DeleteFiles} from './delete-file/deleteFiles';

describe('Firebase Storage - All Tests', () => {
	testSuiteTester(TestSuite_GetAdminBucket);
	testSuiteTester(TestSuite_GetOrCreateBucket);
	testSuiteTester(TestSuite_Storage_Write);
	testSuiteTester(TestSuite_FileDelete);
	testSuiteTester(TestSuite_DeleteFiles);
});