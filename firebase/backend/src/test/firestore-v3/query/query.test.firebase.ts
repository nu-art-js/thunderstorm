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

const runTestCase_QueryUnique = (testCase: typeof TestCases_FirestoreV3_QueryUnique[number]) => () => runSingleTestCase(test_FirestoreV3_QueryUnique, testCase);
const runTestCase_QueryWithPagination = (testCase: typeof TestCases_FirestoreV3_QueryWithPagination[number]) => () => runSingleTestCase(test_FirestoreV3_QueryWithPagination, testCase);
const runTestCase_QueryAll = (testCase: typeof TestCases_FirestoreV3_QueryAll[number]) => () => runSingleTestCase(test_FirestoreV3_QueryAll, testCase);
const runTestCase_QueryComplex1 = (testCase: typeof TestCases_FirestoreV3_QueryComplex1[number]) => () => runSingleTestCase(test_FirestoreV3_QueryComplex1, testCase);

describe('Firestore v3 - Query', () => {
	TestCases_FirestoreV3_QueryUnique.forEach(testCase => {
		it(testCase.description || 'query unique test', runTestCase_QueryUnique(testCase));
	});

	TestCases_FirestoreV3_QueryWithPagination.forEach(testCase => {
		it(testCase.description || 'query pagination test', runTestCase_QueryWithPagination(testCase));
	});

	TestCases_FirestoreV3_QueryAll.forEach(testCase => {
		it(testCase.description || 'query all test', runTestCase_QueryAll(testCase));
	});

	TestCases_FirestoreV3_QueryComplex1.forEach(testCase => {
		it(testCase.description || 'query complex test', runTestCase_QueryComplex1(testCase));
	});
});
