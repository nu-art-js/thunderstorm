import {TestSuit_FB_Insert} from './insert';
import {testSuitTester} from '@nu-art/ts-common/test-index';
import {TestSuit_FB_Query} from './query';
import {TestSuit_FB_QueryUnique} from './query-unique';

export const firestoreTests = {
	insert: () => testSuitTester(TestSuit_FB_Insert),
	query: () => testSuitTester(TestSuit_FB_Query),
	queryUnique: () => testSuitTester(TestSuit_FB_QueryUnique),
};