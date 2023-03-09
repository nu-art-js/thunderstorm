import {TestSuit_FB_Insert} from './insert';
import {testSuiteTester} from '@nu-art/ts-common/test-index';
import {TestSuit_FB_Query} from './query';
import {TestSuit_FB_QueryUnique} from './query-unique';

export const firestoreTests = {
	insert: () => testSuiteTester(TestSuit_FB_Insert),
	query: () => testSuiteTester(TestSuit_FB_Query),
	queryUnique: () => testSuiteTester(TestSuit_FB_QueryUnique),
};