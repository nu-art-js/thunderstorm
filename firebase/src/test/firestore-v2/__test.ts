import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_FirestoreV2_Insert} from './insert/insert';
import {TestSuite_FirestoreV2_Delete} from './delete/delete';
import {TestSuite_FirestoreV2_CreateAll} from './insert/insert-all';
import {TestSuite_FirestoreV2_Update} from './update/update';
import {TestSuite_FirestoreV2_QueryInsert} from './query/query';
import {TestSuite_FirestoreV2_Upsert} from './upsert/upsert';

describe('Firestore v2 - All Tests', () => {
	testSuiteTester(TestSuite_FirestoreV2_Insert);
	testSuiteTester(TestSuite_FirestoreV2_CreateAll);
	testSuiteTester(TestSuite_FirestoreV2_Delete);
	testSuiteTester(TestSuite_FirestoreV2_QueryInsert);
	// testSuiteTester(TestSuite_FirestoreV2_QueryUpsert);
	testSuiteTester(TestSuite_FirestoreV2_Update);
	testSuiteTester(TestSuite_FirestoreV2_Upsert);
});