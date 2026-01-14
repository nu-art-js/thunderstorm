import {CollectionTest, prepareCollectionTest} from '../../_entity/_core/consts.js';
import * as chaiAsPromised from 'chai-as-promised';
import {transactionTestCases} from './consts.js';

const chai = await import("'chai'");
chai.use(chaiAsPromised);

export const TestCases_FB_Transaction: CollectionTest['testcases'] = [
	...transactionTestCases,
];

export const TestSuite_FirestoreV3_Transaction: CollectionTest = {
	label: 'Firestore transaction tests',
	testcases: TestCases_FB_Transaction,
	processor: async (testCase) => {
		await prepareCollectionTest(testCase);
	}
};