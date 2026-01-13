import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_FreeForm, test_FirestoreV3_FreeForm} from './free-form.js';

const runTestCase = (testCase: typeof TestCases_FirestoreV3_FreeForm[number]) => () => runSingleTestCase(test_FirestoreV3_FreeForm, testCase);

describe('Firestore v3 - Free Form', () => {
	TestCases_FirestoreV3_FreeForm.forEach(testCase => {
		it(testCase.description || 'free-form test', runTestCase(testCase));
	});
});
