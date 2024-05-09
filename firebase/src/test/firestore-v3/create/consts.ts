import {compare, PreDB, removeDBObjectKeys} from '@nu-art/ts-common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {duplicateObjectToCreate, getSingleItem, testInstance1, testInstance2, testInstance3, testInstance4, testInstance5} from '../_core/consts';
import {_EmptyQuery} from '../../../main';
import {DB_Type, DBProto_Type, TestInputValue} from '../_entity';
import {FirestoreCollectionV3} from '../../../main/backend/firestore-v3/FirestoreCollectionV3';


export type CreateTestInput = {
	value: TestInputValue;
	expectCreateToThrow?: boolean;
	check?: (collection: FirestoreCollectionV3<DBProto_Type>, expectedItem: TestInputValue) => Promise<void>
}

export type CreateTest = TestSuite<CreateTestInput, TestInputValue>;
const items: PreDB<DB_Type>[] = [
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5,
	testInstance1, testInstance2, testInstance3, testInstance4, testInstance5];

export const createTestCases: CreateTest['testcases'] = [
	{
		description: '1 item',
		result: [duplicateObjectToCreate],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom(_EmptyQuery);
				expect(items.length).to.eql(1);
				expect(true).to.eql(compare(removeDBObjectKeys(items[0]), removeDBObjectKeys(getSingleItem(expectedResult) as DB_Type)));
				expect(items[0]._id).to.eql(getSingleItem(expectedResult)._id);
			}
		}
	},
	{
		description: '2 items',
		result: [testInstance1, testInstance2],
		input: {
			value: [testInstance1, testInstance2],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom(_EmptyQuery);
				expect(items.length).to.eql(2);
				expect(true).to.eql(compare([testInstance1, testInstance2], expectedResult));
			}
		}
	},
	{
		description: '5 items',
		result: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom(_EmptyQuery);
				expect(items.length).to.eql(5);
				expect(true).to.eql(compare([testInstance1, testInstance2, testInstance3, testInstance4, testInstance5], expectedResult));
			}
		}
	},
	{
		description: `${items.length} items`,
		result: items,
		input: {
			value: items,
			check: async (collection, expectedResult) => {
				const dbItems = await collection.query.custom(_EmptyQuery);
				expect(dbItems.length).to.eql(items.length);
				// expect(true).to.eql(compare(items, expectedResult));
			}
		}
	},
	{
		description: '2 identical items',
		result: [testInstance1, testInstance1],
		input: {
			value: [testInstance1, testInstance1],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom(_EmptyQuery);

				expect(items.length).to.eql(2);

				const dbItems = items.map(removeDBObjectKeys);
				expect(true).to.eql(compare(dbItems, expectedResult as DB_Type[]));
			}
		}
	},
	// {
	// 	description: 'id exists',
	// 	result: [testInstance1],
	// 	input: {
	// 		expectCreateToThrow: true,
	// 		value: [{...testInstance1, _id: 'zevel'}, {...testInstance2, _id: 'zevel'},
	// 			{...testInstance3, _id: 'zevel'}, {...testInstance4, _id: 'zevel'}, {...testInstance5, _id: 'zevel'}]
	// 	}
	// }
];
