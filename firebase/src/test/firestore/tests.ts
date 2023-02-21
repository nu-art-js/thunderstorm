import {TestSuit_ts_FB_insert} from './insert/cases';
import {testSuitTester} from '@nu-art/ts-common/testing/consts';


export const firestoreTests = {
	insert: () => testSuitTester(TestSuit_ts_FB_insert),
};