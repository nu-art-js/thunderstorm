import {TestSuite_FileDelete} from './file-delete';
import {testSuiteTester} from '@thunder-storm/common/testing/consts';
import {TestSuite_DeleteFiles} from './deleteFiles';

describe('Firebase Storage - Delete Tests', () => {
	testSuiteTester(TestSuite_FileDelete);
	testSuiteTester(TestSuite_DeleteFiles);
});