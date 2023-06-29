import {queryAllTestCases, queryComplexTestCases, QueryTest, queryTestCases, queryWithPagination} from './consts';
import {CollectionTest, firestore, prepareCollectionTest} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {DBDef, deepClone, tsValidateMustExist} from '@nu-art/ts-common';

const dbDef: DBDef<DB_Type> = {
	dbName: 'firestore-query-tests',
	entityName: 'query-test',
	validator: tsValidateMustExist
};

export const TestCases_FB_QueryUnique: QueryTest['testcases'] = [
	...queryTestCases
];

export const TestCases_FB_QueryPagination: QueryTest['testcases'] = [
	...queryWithPagination
];

export const TestCases_FB_QueryAll: CollectionTest['testcases'] = [
	...queryAllTestCases
];

export const TestCases_FB_QueryComplex1: CollectionTest['testcases'] = [
	...queryComplexTestCases,
];

export const TestSuite_FirestoreV2_QueryUnique: QueryTest = {
	label: 'Firestore query.custom tests',
	testcases: TestCases_FB_QueryUnique,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(dbDef);
		await collection.deleteCollection();
		const toInsert = deepClone(testCase.input.value);
		await collection.create.all(toInsert);
		await testCase.input.check(collection, testCase.result);
	}
};

export const TestSuite_FireStoreV2_QueryWithPagination: QueryTest = {
	label: 'Firestore query.custom with pagination tests',
	testcases: TestCases_FB_QueryPagination,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(dbDef);
		await collection.deleteCollection();
		const toInsert = deepClone(testCase.input.value);
		await collection.create.all(toInsert);
		await testCase.input.check(collection, testCase.result);
	}
};

export const TestSuite_FirestoreV2_QueryAll: CollectionTest = {
	label: 'Firestore query.all tests',
	testcases: TestCases_FB_QueryAll,
	processor: async (testCase) => {
		await prepareCollectionTest(testCase);
	}
};

export const TestSuite_FirestoreV2_QueryComplex1: CollectionTest = {
	label: 'Firestore referenced query tests',
	testcases: TestCases_FB_QueryComplex1,
	processor: async (testCase) => {
		await prepareCollectionTest(testCase);
	}
};