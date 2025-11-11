import {TestSuite_FileDelete} from './file-delete.js';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_DeleteFiles} from './deleteFiles.js';

describe('Firebase Storage - Delete Tests', () => {
	testSuiteTester(TestSuite_FileDelete);
	testSuiteTester(TestSuite_DeleteFiles);
});