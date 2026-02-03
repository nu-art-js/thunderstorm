import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_MultiKeys, test_FirestoreV3_MultiKeys} from './multi-keys.js';

type TestCase_MultiKeys = (typeof TestCases_FirestoreV3_MultiKeys)[number];

const runTestCase = (testCase: TestCase_MultiKeys) => () =>
	runSingleTestCase(test_FirestoreV3_MultiKeys, testCase as any);

const descriptionOf = (testCase: TestCase_MultiKeys): string =>
	typeof testCase.description === 'function' ? testCase.description(testCase) : (testCase.description ?? 'multi-keys test');

describe('Firestore v3 - Multi-Keys', () => {
	TestCases_FirestoreV3_MultiKeys.forEach((testCase: TestCase_MultiKeys) => {
		it(descriptionOf(testCase), runTestCase(testCase));
	});
});
