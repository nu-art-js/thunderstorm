import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Validator, test_FirestoreV3_Validator} from './validator.js';

const runTestCase = (testCase: typeof TestCases_FirestoreV3_Validator[number]) => () => runSingleTestCase(test_FirestoreV3_Validator, testCase);

describe('Firestore v3 - Validator', () => {
	TestCases_FirestoreV3_Validator.forEach(testCase => {
		it(testCase.description || 'validator test', runTestCase(testCase));
	});
});
