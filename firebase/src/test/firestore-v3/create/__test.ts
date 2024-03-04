import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_FirestoreV3_Create} from './create';
import {TestSuite_FirestoreV3_CreateAll} from './create-all';

describe('Firestore v3 - Create and CreateAll', () => {
	testSuiteTester(TestSuite_FirestoreV3_Create);
	testSuiteTester(TestSuite_FirestoreV3_CreateAll);
});