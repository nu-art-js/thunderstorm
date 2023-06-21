import {compare, PreDB, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {DB_Type} from '../_core/types';
import {
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
	check?: (collection: FirestoreCollectionV2<DB_Type>, expectedItem: TestInputValue, expectedIds?: string[]) => Promise<void>
}

export type QueryTest = TestSuite<QueryTestInput, TestInputValue>;

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

export const queryIdTestCases: QueryTest['testcases'] = [
	{
		description: 'by id',
		result: [testInstance1],
		input: {
			value: [{...testInstance1, _id: 'zevel'}],
			check: async (collection, expectedResult, expectedIds) => {
				const items = await collection.query.custom({where: {}});
				expect(items.length).to.eql(1);
				expect(true).to.eql(compare(removeDBObjectKeys(items[0]), getSingleItem(expectedResult) as DB_Type));

			}
		}
	},
];

export const queryComplexTestCases: QueryTest['testcases'] = [
	{
		description: 'complex 1',
		result: [testInstance1],
		input: {
			value: [{...testInstance1, _id: 'zevel'}],
			check: async (collection, expectedResult, expectedIds) => {
				const items = await collection.query.custom({where: {}});
				expect(items.length).to.eql(1);
				expect(true).to.eql(compare(removeDBObjectKeys(items[0]), getSingleItem(expectedResult) as DB_Type));

			}
		}
	},
];