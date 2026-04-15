import {CollectionTest, CollectionTestInput, prepareCollectionTest} from '../../_entity/_core/consts.js';
import {TestInputValue} from '../_entity/type/types.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {transactionTestCases} from './consts.js';

chai.use(chaiAsPromised);

export const TestCases_FB_Transaction: CollectionTest['testcases'] = [
	...transactionTestCases,
];

export const TestCases_FirestoreV3_Transaction = TestCases_FB_Transaction;

export const test_FirestoreV3_Transaction = async (input: CollectionTestInput): Promise<TestInputValue> => {
	await prepareCollectionTest({input, result: []});
	return [];
};

export const TestSuite_FirestoreV3_Transaction: CollectionTest = {
	label: 'Firestore transaction tests',
	testcases: TestCases_FB_Transaction,
	processor: async (testCase: CollectionTest['testcases'][number]) => {
		await prepareCollectionTest(testCase);
	}
};