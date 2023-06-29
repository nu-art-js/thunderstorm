import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_FirestoreV2_Create} from './create';
import {TestSuite_FirestoreV2_CreateAll} from './create-all';

describe('Firestore v2 - Create and CreateAll', () => {
	testSuiteTester(TestSuite_FirestoreV2_Create);
	testSuiteTester(TestSuite_FirestoreV2_CreateAll);
});