import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV2_Performance_WriteMulti, test_FirestoreV2_Performance_WriteMulti} from './write-multi.js';

type TestCase_WriteMulti = (typeof TestCases_FirestoreV2_Performance_WriteMulti)[number];

const runTestCase = (testCase: TestCase_WriteMulti) => () =>
	runSingleTestCase(test_FirestoreV2_Performance_WriteMulti, testCase as any);

describe('Firestore v2 - Performance WriteMulti', () => {
	TestCases_FirestoreV2_Performance_WriteMulti.forEach((testCase: TestCase_WriteMulti) => {
		it(testCase.description ?? 'performance write multi test', runTestCase(testCase));
	});
});
