import {queryAllTestCases, queryComplexTestCases, QueryTest, QueryTestInput, queryTestCases, queryWithPagination} from './consts.js';
import {CollectionTestInput, firestore, prepareCollectionTest} from '../../_entity/_core/consts.js';
import {DBDef_V3, deepClone, tsValidateMustExist, TestInputValue} from '@nu-art/ts-common';
import {DBProto_Type} from '../_entity.js';
import {TestModel} from '@nu-art/testalot';

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

export const TestCases_FB_QueryUnique: QueryTest[] = [
	...queryTestCases
];

export const TestCases_FB_QueryPagination: QueryTest[] = [
	...queryWithPagination
];

export const TestCases_FB_QueryAll: TestModel<CollectionTestInput, TestInputValue>[] = [
	...queryAllTestCases
];

export const TestCases_FB_QueryComplex1: TestModel<CollectionTestInput, TestInputValue>[] = [
	...queryComplexTestCases,
];

const test_QueryUnique = async (input: QueryTestInput): Promise<TestInputValue> => {
	const collection = firestore.getCollection<DBProto_Type>(dbDef);
	await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	const toInsert = deepClone(input.value);
	await collection.create.all(toInsert);
	await input.check(collection, input.value);
	return input.value;
};

const test_QueryWithPagination = async (input: QueryTestInput): Promise<TestInputValue> => {
	const collection = firestore.getCollection<DBProto_Type>(dbDef);
	await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	const toInsert = deepClone(input.value);
	await collection.create.all(toInsert);
	await input.check(collection, input.value);
	return input.value;
};

const test_QueryAll = async (input: CollectionTestInput): Promise<TestInputValue> => {
	await prepareCollectionTest({input, result: []});
	return [];
};

const test_QueryComplex1 = async (input: CollectionTestInput): Promise<TestInputValue> => {
	await prepareCollectionTest({input, result: []});
	return [];
};

export const TestCases_FirestoreV3_QueryUnique = TestCases_FB_QueryUnique;
export const test_FirestoreV3_QueryUnique = test_QueryUnique;

export const TestCases_FirestoreV3_QueryWithPagination = TestCases_FB_QueryPagination;
export const test_FirestoreV3_QueryWithPagination = test_QueryWithPagination;

export const TestCases_FirestoreV3_QueryAll = TestCases_FB_QueryAll;
export const test_FirestoreV3_QueryAll = test_QueryAll;

export const TestCases_FirestoreV3_QueryComplex1 = TestCases_FB_QueryComplex1;
export const test_FirestoreV3_QueryComplex1 = test_QueryComplex1;