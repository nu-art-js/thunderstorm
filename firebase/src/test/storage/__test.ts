import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_Storage_Write} from './write-to-files/write-to-files';

describe('Firebase Storage - All Tests', () => {
	testSuiteTester(TestSuite_Storage_Write);
});