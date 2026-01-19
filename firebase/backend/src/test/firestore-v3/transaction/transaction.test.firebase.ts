import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Transaction, test_FirestoreV3_Transaction} from './transaction.js';
import {TestCases_FirestoreV3_Transaction_MultiWrite, test_FirestoreV3_Transaction_MultiWrite} from './multiWriteTransaction.js';

const runTestCase_Transaction = (testCase: typeof TestCases_FirestoreV3_Transaction[number]) => () => runSingleTestCase(test_FirestoreV3_Transaction, testCase);
const runTestCase_MultiWrite = (testCase: typeof TestCases_FirestoreV3_Transaction_MultiWrite[number]) => () => runSingleTestCase(test_FirestoreV3_Transaction_MultiWrite, testCase);

describe('Firestore v3 - Transaction', () => {
	TestCases_FirestoreV3_Transaction.forEach(testCase => {
		it(testCase.description || 'transaction test', runTestCase_Transaction(testCase));
	});

	TestCases_FirestoreV3_Transaction_MultiWrite.forEach(testCase => {
		it(testCase.description || 'multi-write transaction test', runTestCase_MultiWrite(testCase));
	});
});
