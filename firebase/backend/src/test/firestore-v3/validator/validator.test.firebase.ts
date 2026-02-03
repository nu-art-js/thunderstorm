import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Validator, test_FirestoreV3_Validator} from './validator.js';

type TestCase_Validator = typeof TestCases_FirestoreV3_Validator[number];

const descriptionOf = (testCase: TestCase_Validator): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_Validator) => string)(testCase) : (d ?? 'validator test');
};

const runTestCase = (testCase: TestCase_Validator) => () => runSingleTestCase(test_FirestoreV3_Validator, testCase);

describe('Firestore v3 - Validator', () => {
	TestCases_FirestoreV3_Validator.forEach((testCase: TestCase_Validator) => {
		it(descriptionOf(testCase), runTestCase(testCase));
	});
});
