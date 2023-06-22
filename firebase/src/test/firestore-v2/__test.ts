import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_FirestoreV2_Create} from './insert/insert';
import {TestSuite_FirestoreV2_Delete} from './delete/delete';
import {TestSuite_FirestoreV2_CreateAll} from './insert/insert-all';
import {TestSuite_FirestoreV2_Update} from './update/update';
import {
	TestSuite_FirestoreV2_QueryAll,
	TestSuite_FirestoreV2_QueryComplex1,
	TestSuite_FirestoreV2_QueryUnique
} from './query/query';
import {TestSuite_FirestoreV2_Set} from './set/set';

describe('Firestore v2 - All Tests', () => {
	testSuiteTester(TestSuite_FirestoreV2_Create);
	testSuiteTester(TestSuite_FirestoreV2_CreateAll);
	testSuiteTester(TestSuite_FirestoreV2_Delete);
	testSuiteTester(TestSuite_FirestoreV2_QueryUnique);
	testSuiteTester(TestSuite_FirestoreV2_QueryAll);
	testSuiteTester(TestSuite_FirestoreV2_QueryComplex1);
	testSuiteTester(TestSuite_FirestoreV2_Update);
	testSuiteTester(TestSuite_FirestoreV2_Set);
});