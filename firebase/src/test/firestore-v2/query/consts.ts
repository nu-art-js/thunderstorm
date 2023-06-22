import {compare, deepClone, exists, PreDB, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {TestModel, TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {DB_Type, DB_Type_Query} from '../_core/types';
import {
	firestore,
	getSingleItem,
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5
} from '../_core/consts';


export type TestInputValue = PreDB<DB_Type>[];

export type QueryTestInput = {
	value: TestInputValue;
	expectQueryToThrow?: boolean;
	check: (collection: FirestoreCollectionV2<DB_Type>, expectedItem: TestInputValue, expectedIds?: string[]) => Promise<void>
}

export type ComplexQueryTestInput = {
	outerCollection: PreDB<DB_Type_Query>[];
	innerCollection: PreDB<DB_Type_Query>[];
	outerID?: string,
	innerId?: string
	check: (collectionOuter: FirestoreCollectionV2<DB_Type_Query>, collectionInner: FirestoreCollectionV2<DB_Type_Query>) => Promise<void>
}


export type QueryTest = TestSuite<QueryTestInput, TestInputValue>;
export type ComplexQueryTest = TestSuite<ComplexQueryTestInput, TestInputValue>;

export const outerQueryCollection = [
	{_id: 'id_outer1', name: 'outer1', refs: ['id_inner1', 'id_inner2', 'id_inner3']}
];
export const innerQueryCollection = [
	{_id: 'id_inner1', name: 'inner1', refs: [], parentId: 'id_outer1'},
	{_id: 'id_inner2', name: 'inner2', refs: []},
	{_id: 'id_inner3', name: 'inner3', refs: [], parentId: 'id_outer1'},
	{_id: 'id_inner4', name: 'inner4', refs: []}
];

export const queryTestCases: QueryTest['testcases'] = [
	{
		description: 'no items',
		result: [],
		input: {
			value: [],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom({where: {}});
				expect(items.length).to.eql(0);
				expect(true).to.eql(compare(items, []));
			}
		}
	},
	{
		description: '1 item',
		result: [testInstance1],
		input: {
			value: [testInstance1],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom({where: {}});
				expect(items.length).to.eql(1);
				expect(true).to.eql(compare(removeDBObjectKeys(items[0]), getSingleItem(expectedResult) as DB_Type));

			}
		}
	},
	{
		description: '5 items',
		result: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				const items = sortArray(await collection.query.custom({where: {}}), item => item.numeric);
				expect(items.length).to.eql(5);
				expect(true).to.eql(compare(items.map(removeDBObjectKeys), expectedResult));
			}
		}
	},
];

export const queryAllTestCases: ComplexQueryTest['testcases'] = [
	{
		description: 'by 1 id',
		result: [testInstance1],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const outerItem = await collectionOuter.query.all(['id_outer1']);
				expect(outerItem.length).to.eql(1);
			}
		}
	},
	{
		description: '2 ids',
		result: [testInstance1],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const items = await collectionInner.query.all(['id_inner1', 'id_inner2']);
				expect(items.length).to.eql(2);
			}
		}
	},
];


export const queryComplexTestCases: ComplexQueryTest['testcases'] = [
	{
		description: 'get all referenced objects',
		result: [testInstance1],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const outerItem = await collectionOuter.query.unique('id_outer1');
				expect(true).to.eql(exists(outerItem));
				const innerItems = await collectionInner.query.all(outerItem.refs);
				expect(innerItems.length).to.eql(3);
			}
		}
	},
	{
		description: 'get all by identifier',
		result: [testInstance1],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const innerItems = await collectionInner.query.custom({where: {parentId: 'id_outer1'}});
				expect(innerItems.length).to.eql(2);
			}
		}
	},
];

export async function prepareQueryTest(testCase: TestModel<ComplexQueryTestInput, TestInputValue>) {
	const outerCollection = firestore.getCollection<DB_Type_Query>('firestore-query-tests-outer');
	const innerCollection = firestore.getCollection<DB_Type_Query>('firestore-query-tests-inner');
	await Promise.all([outerCollection, innerCollection].map(async (collection) => await collection.deleteCollection()));
	const outerToInsert = deepClone(testCase.input.outerCollection);
	const innerToInsert = deepClone(testCase.input.innerCollection);
	await outerCollection.set.all(outerToInsert);
	await innerCollection.set.all(innerToInsert);
	await testCase.input.check(outerCollection, innerCollection);
}