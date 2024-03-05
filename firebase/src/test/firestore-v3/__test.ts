import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_FirestoreV3_Create} from './create/create';
import {TestSuite_FirestoreV3_CreateAll} from './create/create-all';
import {TestSuite_FirestoreV3_Delete} from './delete/delete';
import {
	TestSuite_FirestoreV3_QueryAll,
	TestSuite_FirestoreV3_QueryComplex1,
	TestSuite_FirestoreV3_QueryUnique,
	TestSuite_FireStoreV3_QueryWithPagination
} from './query/query';
import {TestSuite_FirestoreV3_Set} from './set/set';
import {TestSuite_FirestoreV3_Validator} from './validator/validator';
import {TestSuite_FirestoreV3_MultiKeys} from './multi-keys/multi-keys';
import {TestSuite_FirestoreV3_Transaction} from './transaction/transaction';
import {TestSuite_FirestoreV3_Transaction_MultiWrite} from './transaction/multiWriteTransaction';


describe('Firestore v3 - All Tests', () => {
	testSuiteTester(TestSuite_FirestoreV3_Create);
	testSuiteTester(TestSuite_FirestoreV3_CreateAll);
	testSuiteTester(TestSuite_FirestoreV3_Delete);
	testSuiteTester(TestSuite_FirestoreV3_QueryUnique);
	testSuiteTester(TestSuite_FireStoreV3_QueryWithPagination);
	testSuiteTester(TestSuite_FirestoreV3_QueryAll);
	testSuiteTester(TestSuite_FirestoreV3_QueryComplex1);
	testSuiteTester(TestSuite_FirestoreV3_Set);
	testSuiteTester(TestSuite_FirestoreV3_Validator);
	testSuiteTester(TestSuite_FirestoreV3_MultiKeys);
	testSuiteTester(TestSuite_FirestoreV3_Transaction);
	testSuiteTester(TestSuite_FirestoreV3_Transaction_MultiWrite);
});