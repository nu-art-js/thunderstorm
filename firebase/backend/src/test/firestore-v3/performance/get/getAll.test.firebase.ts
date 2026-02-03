import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Performance_GetAll, test_FirestoreV3_Performance_GetAll} from './getAll.js';

type TestCase_GetAll = (typeof TestCases_FirestoreV3_Performance_GetAll)[number];

const runTestCase = (testCase: TestCase_GetAll) => () => runSingleTestCase(test_FirestoreV3_Performance_GetAll, testCase as any);

describe('Firestore v3 - Performance GetAll', () => {
	TestCases_FirestoreV3_Performance_GetAll.forEach((testCase: TestCase_GetAll) => {
		it(testCase.description ?? 'performance getAll test', runTestCase(testCase));
	});
});
