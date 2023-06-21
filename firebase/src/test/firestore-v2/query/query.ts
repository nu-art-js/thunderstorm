import {queryIdTestCases, QueryTest, queryTestCases} from './consts';
import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {dbObjectToId, deepClone} from '@nu-art/ts-common';

export const TestCases_FB_QueryInsert: QueryTest['testcases'] = [
	...queryTestCases
];

export const TestCases_FB_QueryUpsert: QueryTest['testcases'] = [
	...queryIdTestCases
];

export const TestCases_FB_QueryComplex1: QueryTest['testcases'] = [
	// queryComplexTestCases[0],
];

export const TestSuite_FirestoreV2_QueryInsert: QueryTest = {
	label: 'Firestore query tests',
	testcases: TestCases_FB_QueryInsert,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-query-tests');
		await collection.deleteCollection();
		const toInsert = deepClone(testCase.input.value);
		await collection.insert.all(toInsert);
		await testCase.input.check!(collection, testCase.result);
	}
};

export const TestSuite_FirestoreV2_QueryUpsert: QueryTest = {
	label: 'Firestore query tests',
	testcases: TestCases_FB_QueryUpsert,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-query-tests');
		await collection.deleteCollection();
		const toInsert = deepClone(testCase.input.value);
		const resultDBObjects = await collection.insert.all(toInsert);
		await testCase.input.check!(collection, testCase.result, resultDBObjects.map(dbObjectToId));
	}
};

export const TestSuite_FirestoreV2_QueryComplex1: QueryTest = {
	label: 'Firestore query tests',
	testcases: TestCases_FB_QueryComplex1,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-query-tests');
		await collection.deleteCollection();
		//todo insert 2 different collections, obj that points to obj
		//todo receive outer obj id - test is to find and retrieve the inner objects referenced by the outer obj.
		//todo receive outer obj id and inner obj name - test is to find the inner specific obj referenced by the outer obj.
		const toInsert = deepClone(testCase.input.value);
		const resultDBObjects = await collection.insert.all(toInsert);
		await testCase.input.check!(collection, testCase.result, resultDBObjects.map(dbObjectToId));
	}
};