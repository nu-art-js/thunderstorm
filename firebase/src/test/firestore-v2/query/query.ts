import {QueryTest, queryTestCases} from './consts';
import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {deepClone} from '@nu-art/ts-common';

export const TestCases_FB_Query: QueryTest['testcases'] = [
	...queryTestCases
];

export const TestSuite_FirestoreV2_Query: QueryTest = {
	label: 'Firestore query tests',
	testcases: TestCases_FB_Query,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-query-tests');
		await collection.deleteCollection();
		const toInsert = deepClone(testCase.input.value);
		await collection.insert.all(toInsert);
	}
};