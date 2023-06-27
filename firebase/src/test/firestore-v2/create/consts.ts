import {compare, PreDB, removeDBObjectKeys} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {FB_Type} from '../../firestore/_core/types';
import {DB_Type, TestInputValue} from '../_core/types';
import {
	getSingleItem,
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5
} from '../_core/consts';


export type CreateTestInput = {
	value: TestInputValue;
	expectCreateToThrow?: boolean;
	check?: (collection: FirestoreCollectionV2<DB_Type>, expectedItem: TestInputValue) => Promise<void>
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
		description: '2 items',
		result: [testInstance1, testInstance2],
		input: {
			value: [testInstance1, testInstance2],
			check: async (collection, expectedResult) => {
				const items = await collection.query.custom({where: {}});
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
				const items = await collection.query.custom({where: {}});
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
				const dbItems = await collection.query.custom({where: {}});
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
				const items = await collection.query.custom({where: {}});

				expect(items.length).to.eql(2);

				const dbItems = items.map(removeDBObjectKeys);
				expect(true).to.eql(compare(dbItems, expectedResult as FB_Type[]));
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
