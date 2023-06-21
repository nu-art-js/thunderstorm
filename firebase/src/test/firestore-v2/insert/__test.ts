import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_FirestoreV2_Create} from './insert';
import {TestSuite_FirestoreV2_CreateAll} from './insert-all';

describe('Firestore v2 - Insert and InsertAll', () => {
	testSuiteTester(TestSuite_FirestoreV2_Create);
	testSuiteTester(TestSuite_FirestoreV2_CreateAll);
});