import {testSuiteTester} from '@nu-art/ts-common/test-index';
import {TestSuit_DB_Query} from './query';


export const firestoreTests = {
	query: () => testSuiteTester(TestSuit_DB_Query),
};