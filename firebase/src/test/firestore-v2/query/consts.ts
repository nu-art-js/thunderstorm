import {compare, exists, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {DB_Type, TestInputValue} from '../_core/types';
import {
	CollectionTest,
	getSingleItem,
	id_inner1,
	id_inner2,
	id_outer1,
	innerQueryCollection,
	outerQueryCollection,
	outerValue1,
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5
} from '../_core/consts';
import {_EmptyQuery} from '../../../main';

export type QueryTestInput = {
	value: TestInputValue;
	expectQueryToThrow?: boolean;
	check: (collection: FirestoreCollectionV2<DB_Type>, expectedItem: TestInputValue, expectedIds?: string[]) => Promise<void>
}

export type QueryTest = TestSuite<QueryTestInput, TestInputValue>;

export const queryTestCases: QueryTest['testcases'] = [
	{
		description: 'no items',
		result: [],
		input: {
			value: [],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom(_EmptyQuery);
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
				const items = await collection.query.custom(_EmptyQuery);
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
				const items = sortArray(await collection.query.custom(_EmptyQuery), item => item.numeric);
				expect(items.length).to.eql(5);
				expect(true).to.eql(compare(items.map(removeDBObjectKeys), expectedResult));
			}
		}
	},
	{
		description: '5 items in transaction',
		result: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				await collection.runTransaction(async (transaction) => {
					const items = sortArray(await collection.query.custom(_EmptyQuery, transaction), item => item.numeric);
					expect(items.length).to.eql(5);
					expect(true).to.eql(compare(items.map(removeDBObjectKeys), expectedResult));
				});
			}
		}
	},
];

export const queryAllTestCases: CollectionTest['testcases'] = [
	{
		description: 'by 1 id',
		result: [testInstance1],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const outerItems = await collectionOuter.query.all([id_outer1]);
				expect(outerItems.length).to.eql(1);
				expect(outerValue1._id).to.eql(outerItems[0]?._id);
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
				const items = await collectionInner.query.all([id_inner1, id_inner2]);
				expect(items.length).to.eql(2);
				expect(items[0]?._id).to.eql(id_inner1);
			}
		}
	},
	{
		description: '2 ids in transaction',
		result: [testInstance1],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				await collectionInner.runTransaction(async (transaction) => {
					const items = await collectionInner.query.all([id_inner1, id_inner2], transaction);
					expect(items.length).to.eql(2);
				});
			}
		}
	},
];


export const queryComplexTestCases: CollectionTest['testcases'] = [
	{
		description: 'get all referenced objects',
		result: [testInstance1],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				const outerItem = await collectionOuter.query.unique(id_outer1);
				expect(true).to.eql(exists(outerItem));
				const innerItems = await collectionInner.query.all(outerItem!.refs);
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
				const innerItems = await collectionInner.query.custom({where: {parentId: id_outer1}});
				expect(innerItems.length).to.eql(5);
				expect(true).to.eql(innerItems.every(item => item.parentId === id_outer1));
			}
		}
	},
	{
		description: 'get all by identifier in transaction',
		result: [testInstance1],
		input: {
			outerCollection: outerQueryCollection,
			innerCollection: innerQueryCollection,
			check: async (collectionOuter, collectionInner) => {
				await collectionInner.runTransaction(async (transaction) => {
					const innerItems = await collectionInner.query.custom({where: {parentId: id_outer1}}, transaction);
					expect(innerItems.length).to.eql(5);
					expect(true).to.eql(innerItems.every(item => item.parentId === id_outer1));
				});
			}
		}
	}
];

export const queryWithPagination: QueryTest['testcases'] = [
	{
		description: 'all out of 10',
		result: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5, testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5, testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				const itemsPage0 = await collection.query.custom({
					where: {},
					orderBy: [{key: 'stringValue', order: 'asc'}],
					limit: {page: 0, itemsCount: 5}
				});

				expect(itemsPage0.length).to.eql(5);
				const itemsPage1 = await collection.query.custom({
					where: {},
					orderBy: [{key: 'stringValue', order: 'asc'}],
					limit: {page: 1, itemsCount: 5}
				});

				expect(itemsPage1.length).to.eql(5);
				const itemsPage2 = await collection.query.custom({
					where: {},
					orderBy: [{key: 'stringValue', order: 'asc'}],
					limit: {page: 2, itemsCount: 5}
				});

				expect(itemsPage2.length).to.eql(0);
			}
		}
	},
	{
		description: 'limit 3 elements out of 5',
		result: [testInstance1, testInstance2, testInstance3],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom({
					where: {},
					orderBy: [{key: 'stringValue', order: 'asc'}],
					limit: 3
				});

				expect(items.length).to.eql(3);
				expect(true).to.eql(expectedResult.every((item, index) => item._uniqueId === items[index]._uniqueId));
			}
		}
	},
	{
		description: 'only items 2# and 3#',
		result: [],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom({
					where: {},
					orderBy: [{key: 'stringValue', order: 'asc'}],
					limit: {page: 1, itemsCount: 2}
				});

				expect(items.length).to.eql(2);
			}
		}
	},
	{
		description: 'only items 2# and 3# in transaction',
		result: [],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				await collection.runTransaction(async (transaction) => {
					const items = await collection.query.custom({
						where: {},
						orderBy: [{key: 'stringValue', order: 'asc'}],
						limit: {page: 1, itemsCount: 2}
					}, transaction);

					expect(items.length).to.eql(2);
				});
			}
		}
	}
];