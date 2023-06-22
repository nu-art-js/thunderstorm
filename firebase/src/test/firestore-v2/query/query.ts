import {
	ComplexQueryTest,
	prepareQueryTest,
	queryAllTestCases,
	queryComplexTestCases,
	QueryTest,
	queryTestCases
} from './consts';
import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {deepClone} from '@nu-art/ts-common';

export const TestCases_FB_QueryUnique: QueryTest['testcases'] = [
	...queryTestCases
];

export const TestCases_FB_QueryAll: ComplexQueryTest['testcases'] = [
	...queryAllTestCases
];

export const TestCases_FB_QueryComplex1: ComplexQueryTest['testcases'] = [
	...queryComplexTestCases,
];

export const TestSuite_FirestoreV2_QueryUnique: QueryTest = {
	label: 'Firestore query.custom tests',
	testcases: TestCases_FB_QueryUnique,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-query-tests');
		await collection.deleteCollection();
		const toInsert = deepClone(testCase.input.value);
		await collection.create.all(toInsert);
		await testCase.input.check(collection, testCase.result);
	}
};

export const TestSuite_FirestoreV2_QueryAll: ComplexQueryTest = {
	label: 'Firestore query.all tests',
	testcases: TestCases_FB_QueryAll,
	processor: async (testCase) => {
		await prepareQueryTest(testCase);
	}
};

export const TestSuite_FirestoreV2_QueryComplex1: ComplexQueryTest = {
	label: 'Firestore complex query tests',
	testcases: TestCases_FB_QueryComplex1,
	processor: async (testCase) => {
		await prepareQueryTest(testCase);
	}
};