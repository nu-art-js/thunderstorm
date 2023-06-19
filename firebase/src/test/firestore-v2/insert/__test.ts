import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuit_FirestoreV2_Insert} from './insert';
import {prepare__Test} from '../_core/consts';

prepare__Test();

describe('Firestore v2 - Insert', () => {
	testSuiteTester(TestSuit_FirestoreV2_Insert);
});
