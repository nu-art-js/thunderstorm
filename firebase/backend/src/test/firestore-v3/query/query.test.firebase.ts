import {runSingleTestCase} from '@nu-art/testalot';
import {
	TestCases_FirestoreV3_QueryUnique,
	test_FirestoreV3_QueryUnique,
	TestCases_FirestoreV3_QueryWithPagination,
	test_FirestoreV3_QueryWithPagination,
	TestCases_FirestoreV3_QueryAll,
	test_FirestoreV3_QueryAll,
	TestCases_FirestoreV3_QueryComplex1,
	test_FirestoreV3_QueryComplex1
} from './query.js';

type TestCase_QueryUnique = (typeof TestCases_FirestoreV3_QueryUnique)[number];
type TestCase_QueryWithPagination = (typeof TestCases_FirestoreV3_QueryWithPagination)[number];
type TestCase_QueryAll = (typeof TestCases_FirestoreV3_QueryAll)[number];
type TestCase_QueryComplex1 = (typeof TestCases_FirestoreV3_QueryComplex1)[number];

const descriptionOf = <T>(testCase: T, fallback: string): string =>
	typeof (testCase as { description?: string | ((tc: T) => string) }).description === 'function'
		? (testCase as { description: (tc: T) => string }).description(testCase)
		: ((testCase as { description?: string }).description ?? fallback);

const runTestCase_QueryUnique = (testCase: TestCase_QueryUnique) => () => runSingleTestCase(test_FirestoreV3_QueryUnique, testCase as any);
const runTestCase_QueryWithPagination = (testCase: TestCase_QueryWithPagination) => () => runSingleTestCase(test_FirestoreV3_QueryWithPagination, testCase as any);
const runTestCase_QueryAll = (testCase: TestCase_QueryAll) => () => runSingleTestCase(test_FirestoreV3_QueryAll, testCase as any);
const runTestCase_QueryComplex1 = (testCase: TestCase_QueryComplex1) => () => runSingleTestCase(test_FirestoreV3_QueryComplex1, testCase as any);

describe('Firestore v3 - Query', () => {
	TestCases_FirestoreV3_QueryUnique.forEach((testCase: TestCase_QueryUnique) => {
		it(descriptionOf(testCase, 'query unique test'), runTestCase_QueryUnique(testCase));
	});

	TestCases_FirestoreV3_QueryWithPagination.forEach((testCase: TestCase_QueryWithPagination) => {
		it(descriptionOf(testCase, 'query pagination test'), runTestCase_QueryWithPagination(testCase));
	});

	TestCases_FirestoreV3_QueryAll.forEach((testCase: TestCase_QueryAll) => {
		it(descriptionOf(testCase, 'query all test'), runTestCase_QueryAll(testCase));
	});

	TestCases_FirestoreV3_QueryComplex1.forEach((testCase: TestCase_QueryComplex1) => {
		it(descriptionOf(testCase, 'query complex test'), runTestCase_QueryComplex1(testCase));
	});
});
