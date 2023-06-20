import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuit_FirestoreV2_Insert} from './insert';
import {TestSuit_FirestoreV2_InsertAll} from './insert-all';

describe('Firestore v2 - Insert and InsertAll', () => {
	testSuiteTester(TestSuit_FirestoreV2_Insert);
	testSuiteTester(TestSuit_FirestoreV2_InsertAll);
});