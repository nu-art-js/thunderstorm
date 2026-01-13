import {testSuiteTester} from '@nu-art/testalot';
import {TestSuite_Storage_Write} from './write-to-files/write-to-files.js';
import {TestSuite_GetAdminBucket} from './bucket-utils/getMainBucket.js';
import {TestSuite_GetOrCreateBucket} from './bucket-utils/getOrCreateBucket.js';
import {TestSuite_FileDelete} from './delete-file/file-delete.js';
import {TestSuite_DeleteFiles} from './delete-file/deleteFiles.js';
import {TestSuite_WriteInChunks} from './write-in-chunks/write-in-chunks.js';

describe('Firebase Storage - All Tests', () => {
	testSuiteTester(TestSuite_GetAdminBucket);
	testSuiteTester(TestSuite_GetOrCreateBucket);
	testSuiteTester(TestSuite_Storage_Write);
	testSuiteTester(TestSuite_WriteInChunks);
	testSuiteTester(TestSuite_FileDelete);
	testSuiteTester(TestSuite_DeleteFiles);
});