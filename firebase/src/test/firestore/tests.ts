import {TestSuit_FB_Insert} from './insert';
import {testSuitTester} from '@nu-art/ts-common/test-index';


export const firestoreTests = {
	insert: () => testSuitTester(TestSuit_FB_Insert),
};