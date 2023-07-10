import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_FirestoreV2_Create} from './create/create';
import {TestSuite_FirestoreV2_CreateAll} from './create/create-all';
import {
	TestSuite_FirestoreV2_QueryAll,
	TestSuite_FirestoreV2_QueryComplex1,
	TestSuite_FirestoreV2_QueryUnique,
	TestSuite_FireStoreV2_QueryWithPagination
} from './query/query';
import {TestSuite_FirestoreV2_Update} from './update/update';
import {TestSuite_FirestoreV2_Set} from './set/set';
import {TestSuite_FirestoreV2_Validator} from './validator/validator';
import {TestSuite_FirestoreV2_MultiKeys} from './multi-keys/multi-keys';
import {TestSuite_FirestoreV2_Transaction} from './transaction/transaction';


describe('Firestore v2 - All Tests', () => {
	testSuiteTester(TestSuite_FirestoreV2_Create);
	testSuiteTester(TestSuite_FirestoreV2_CreateAll);
	// testSuiteTester(TestSuite_FirestoreV2_Delete);
	testSuiteTester(TestSuite_FirestoreV2_QueryUnique);
	testSuiteTester(TestSuite_FireStoreV2_QueryWithPagination);
	testSuiteTester(TestSuite_FirestoreV2_QueryAll);
	testSuiteTester(TestSuite_FirestoreV2_QueryComplex1);
	testSuiteTester(TestSuite_FirestoreV2_Update);
	// testSuiteTester(TestSuite_FirestoreV2_Upsert);
	testSuiteTester(TestSuite_FirestoreV2_Set);
	testSuiteTester(TestSuite_FirestoreV2_Validator);
	testSuiteTester(TestSuite_FirestoreV2_MultiKeys);
	testSuiteTester(TestSuite_FirestoreV2_Transaction);
	// testSuiteTester(TestSuite_FirestoreV2_Performance_GetAll);
	// testSuiteTester(TestSuite_FirestoreV2_Performance_CreateAll);
});