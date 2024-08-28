import {queryAllTestCases, queryComplexTestCases, QueryTest, queryTestCases, queryWithPagination} from './consts';
import {CollectionTest, firestore, prepareCollectionTest} from '../_core/consts';
import {DBDef_V3, deepClone, tsValidateMustExist} from '@thunder-storm/common';
import {DBProto_Type} from '../_entity';

const dbDef: DBDef_V3<DBProto_Type> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	dbKey: 'firestore-query-tests',
	entityName: 'query-test',
	versions: ['1.0.0'],
	frontend: {
		group: 'test',
		name: 'firestore-query-tests',
	},
	backend: {
		name: 'firestore-query-tests'
	}
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

export const TestSuite_FirestoreV3_QueryUnique: QueryTest = {
	label: 'Firestore query.custom tests',
	testcases: TestCases_FB_QueryUnique,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DBProto_Type>(dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		const toInsert = deepClone(testCase.input.value);
		await collection.create.all(toInsert);
		await testCase.input.check(collection, testCase.result);
	}
};

export const TestSuite_FireStoreV3_QueryWithPagination: QueryTest = {
	label: 'Firestore query.custom with pagination tests',
	testcases: TestCases_FB_QueryPagination,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DBProto_Type>(dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		const toInsert = deepClone(testCase.input.value);
		await collection.create.all(toInsert);
		await testCase.input.check(collection, testCase.result);
	}
};

export const TestSuite_FirestoreV3_QueryAll: CollectionTest = {
	label: 'Firestore query.all tests',
	testcases: TestCases_FB_QueryAll,
	processor: async (testCase) => {
		await prepareCollectionTest(testCase);
	}
};

export const TestSuite_FirestoreV3_QueryComplex1: CollectionTest = {
	label: 'Firestore referenced query tests',
	testcases: TestCases_FB_QueryComplex1,
	processor: async (testCase) => {
		await prepareCollectionTest(testCase);
	}
};