import {compare, PreDB, removeDBObjectKeys} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {DB_Type} from '../_core/types';
import {getSingleItem, testInstance1} from '../_core/consts';


export type TestInputValue = PreDB<DB_Type>[];

export type QueryTestInput = {
	value: TestInputValue;
	expectQueryToThrow?: boolean;
	check?: (collection: FirestoreCollectionV2<DB_Type>, expectedItem: TestInputValue) => Promise<void>
}

export type QueryTest = TestSuite<QueryTestInput, TestInputValue>;

export const queryTestCases: QueryTest['testcases'] = [
	{
		description: '1 item',
		result: [testInstance1],
		input: {
			value: [testInstance1],
			check: async (collection, expectedResult) => {
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(1);
				expect(true).to.eql(compare(removeDBObjectKeys(items[0]), getSingleItem(expectedResult) as DB_Type));

			}
		}
	},
	// {
	// 	description: '5 items',
	// 	result: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
	// 	input: {
	// 		value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
	// 		check: async (collection, expectedResult) => {
	// 			const items = await collection.queryInstances({where: {}});
	// 			expect(items.length).to.eql(5);
	// 			expect(true).to.eql(compare([testInstance1, testInstance2, testInstance3, testInstance4, testInstance5], expectedResult));
	// 		}
	// 	}
	// },
	// {
	// 	description: '2 identical items',
	// 	result: [testInstance1, testInstance1],
	// 	input: {
	// 		value: [testInstance1, testInstance1],
	// 		check: async (collection, expectedResult) => {
	// 			const items = await collection.queryInstances({where: {}});
	//
	// 			expect(items.length).to.eql(2);
	//
	// 			const dbItems = items.map(removeDBObjectKeys);
	// 			expect(true).to.eql(compare(dbItems, expectedResult as FB_Type[]));
	// 		}
	// 	}
	// },
	// {
	// 	description: 'id exists',
	// 	result: [testInstance1],
	// 	input: {
	// 		expectQueryToThrow: true,
	// 		value: [{...testInstance1, _id: 'zevel'}]
	// 	}
	// }
];