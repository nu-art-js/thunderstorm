import {testSuitTester} from './insert/Test';
import {TestSuit_ts_FB_insert} from './insert/cases';


export const firestoreTests = {
	insert: () => testSuitTester(TestSuit_ts_FB_insert),
};