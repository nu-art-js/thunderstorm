import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Create, test_FirestoreV3_Create} from './create.js';
import {TestCases_FirestoreV3_CreateAll, test_FirestoreV3_CreateAll} from './create-all.js';

type TestCase_Create = typeof TestCases_FirestoreV3_Create[number];
type TestCase_CreateAll = typeof TestCases_FirestoreV3_CreateAll[number];

const descriptionOf_Create = (testCase: TestCase_Create): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_Create) => string)(testCase) : (d ?? 'create test');
};
const descriptionOf_CreateAll = (testCase: TestCase_CreateAll): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_CreateAll) => string)(testCase) : (d ?? 'create all test');
};

const runTestCase_Create = (testCase: TestCase_Create) => () => runSingleTestCase(test_FirestoreV3_Create, testCase);
const runTestCase_CreateAll = (testCase: TestCase_CreateAll) => () => runSingleTestCase(test_FirestoreV3_CreateAll, testCase);

describe('Firestore v3 - Create', () => {
	TestCases_FirestoreV3_Create.forEach((testCase: TestCase_Create) => {
		it(descriptionOf_Create(testCase), runTestCase_Create(testCase));
	});
});

describe('Firestore v3 - CreateAll', () => {
	TestCases_FirestoreV3_CreateAll.forEach((testCase: TestCase_CreateAll) => {
		it(descriptionOf_CreateAll(testCase), runTestCase_CreateAll(testCase));
	});
});
