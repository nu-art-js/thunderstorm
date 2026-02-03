import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Transaction, test_FirestoreV3_Transaction} from './transaction.js';
import {TestCases_FirestoreV3_Transaction_MultiWrite, test_FirestoreV3_Transaction_MultiWrite} from './multiWriteTransaction.js';

type TestCase_Transaction = typeof TestCases_FirestoreV3_Transaction[number];
type TestCase_MultiWrite = typeof TestCases_FirestoreV3_Transaction_MultiWrite[number];

const descriptionOf_Transaction = (testCase: TestCase_Transaction): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_Transaction) => string)(testCase) : (d ?? 'transaction test');
};
const descriptionOf_MultiWrite = (testCase: TestCase_MultiWrite): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_MultiWrite) => string)(testCase) : (d ?? 'multi-write transaction test');
};

const runTestCase_Transaction = (testCase: TestCase_Transaction) => () => runSingleTestCase(test_FirestoreV3_Transaction, testCase);
const runTestCase_MultiWrite = (testCase: TestCase_MultiWrite) => () => runSingleTestCase(test_FirestoreV3_Transaction_MultiWrite, testCase);

describe('Firestore v3 - Transaction', () => {
	TestCases_FirestoreV3_Transaction.forEach((testCase: TestCase_Transaction) => {
		it(descriptionOf_Transaction(testCase), runTestCase_Transaction(testCase));
	});

	TestCases_FirestoreV3_Transaction_MultiWrite.forEach((testCase: TestCase_MultiWrite) => {
		it(descriptionOf_MultiWrite(testCase), runTestCase_MultiWrite(testCase));
	});
});
