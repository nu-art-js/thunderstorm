import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_FirestoreV2_Insert} from './insert/insert';
import {TestSuite_FirestoreV2_Delete} from './delete/delete';
import {TestSuite_FirestoreV2_InsertAll} from './insert/insert-all';
import {TestSuite_FirestoreV2_Update} from './update/update';
import {TestSuite_FirestoreV2_Query} from './query/query';

describe('Firestore v2 - All Tests', () => {
	testSuiteTester(TestSuite_FirestoreV2_Insert);
	testSuiteTester(TestSuite_FirestoreV2_InsertAll);
	testSuiteTester(TestSuite_FirestoreV2_Delete);
	testSuiteTester(TestSuite_FirestoreV2_Query);
	testSuiteTester(TestSuite_FirestoreV2_Update);
});