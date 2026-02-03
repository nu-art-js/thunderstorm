import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_FreeForm, test_FirestoreV3_FreeForm} from './free-form.js';
import type {TestModel_FreeForm} from './types.js';

type TestCase_FreeFormItem = TestModel_FreeForm['testcases'][number];

const runTestCase = (testCase: TestCase_FreeFormItem) => () => runSingleTestCase(test_FirestoreV3_FreeForm, testCase);

const descriptionOf = (testCase: TestCase_FreeFormItem): string =>
	typeof testCase.description === 'function' ? testCase.description(testCase) : (testCase.description ?? 'free-form test');

describe('Firestore v3 - Free Form', () => {
	TestCases_FirestoreV3_FreeForm.forEach((testCase: TestCase_FreeFormItem) => {
		it(descriptionOf(testCase), runTestCase(testCase));
	});
});
