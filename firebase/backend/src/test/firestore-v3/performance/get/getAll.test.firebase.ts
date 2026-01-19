import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Performance_GetAll, test_FirestoreV3_Performance_GetAll} from './getAll.js';

const runTestCase = (testCase: typeof TestCases_FirestoreV3_Performance_GetAll[number]) => () => runSingleTestCase(test_FirestoreV3_Performance_GetAll, testCase);

describe('Firestore v3 - Performance GetAll', () => {
	TestCases_FirestoreV3_Performance_GetAll.forEach(testCase => {
		it(testCase.description || 'performance getAll test', runTestCase(testCase));
	});
});
