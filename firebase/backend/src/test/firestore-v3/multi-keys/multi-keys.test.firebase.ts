import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_MultiKeys, test_FirestoreV3_MultiKeys} from './multi-keys.js';

const runTestCase = (testCase: typeof TestCases_FirestoreV3_MultiKeys[number]) => () => runSingleTestCase(test_FirestoreV3_MultiKeys, testCase);

describe('Firestore v3 - Multi-Keys', () => {
	TestCases_FirestoreV3_MultiKeys.forEach(testCase => {
		it(testCase.description || 'multi-keys test', runTestCase(testCase));
	});
});
