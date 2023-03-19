import {TestModel, TestSuite} from '@nu-art/ts-common/test-index';
import {FirestoreCollection, ModuleBE_Firebase} from '../../main/backend';
import {FB_Type} from './_core/types';
import {FirestoreQuery} from '../../main';
import {
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5,
	testItem1,
	testNumber2,
	testNumber3,
	testString1,
	testString2,
	testString3,
	testString4
} from './_core/consts';
import {expect} from 'chai';
import {sortArray} from '@nu-art/ts-common';

type Test = TestSuite<Input, Partial<FB_Type>[]>;

type Input = {
	query: FirestoreQuery<FB_Type>;
	test?: (collection: FirestoreCollection<any>, testCase: TestModel<Input, Partial<FB_Type>[]>) => (void | Promise<void>)
}

const allTestItems = [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5];

const TestCases_FB_Query: Test['testcases'] = [
	{
		description: 'Query no Limit',
		result: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
		input: {
			query: {
				where: {},
			}
		},
	},
	{
		description: 'Query Limit 1',
		result: [testInstance1],
		input: {
			query: {
				where: {stringValue: testString1},
				limit: 1,
			},
			test: async (_collection, testCase) => {
				const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
				const collection = firestore.getCollection('firestore-query-tests-secondary');
				await collection.deleteAll();
				await collection.insertAll([testInstance1, testInstance1]);
				const items = await collection.query(testCase.input.query);
				expect(items).to.eql(testCase.result);
			}
		},
	},
	{
		description: 'Query LESSER than',
		result: [testInstance1, testInstance2],
		input: {
			query: {
				where: {numeric: {'$lt': testNumber3}},
			}
		},
	},
	{
		description: 'Query LESSER than or EQUALS to',
		result: [testInstance1, testInstance2, testInstance3],
		input: {
			query: {
				where: {numeric: {'$lte': testNumber3}},
			}
		},
	},
	{
		description: 'Query GREATER than',
		result: [testInstance4, testInstance5],
		input: {
			query: {
				where: {numeric: {'$gt': testNumber3}},
			}
		},
	},
	{
		description: 'Query GREATER than or EQUALS to',
		result: [testInstance3, testInstance4, testInstance5],
		input: {
			query: {
				where: {numeric: {'$gte': testNumber3}},
			}
		},
	},
	{
		description: 'Query EQUALS to #1',
		result: [testInstance3],
		input: {
			query: {
				where: {numeric: {'$eq': testNumber3}},
			}
		},
	},
	{
		description: 'Query EQUALS to #2',
		result: [testInstance3],
		input: {
			query: {
				where: {numeric: testNumber3},
			}
		},
	},
	{
		description: 'Query IN number',
		result: [testInstance2, testInstance3],
		input: {
			query: {
				where: {numeric: {'$in': [testNumber3, testNumber2]}},
			}
		},
	},
	{
		description: 'Query IN string',
		result: [testInstance2, testInstance4],
		input: {
			query: {
				where: {stringValue: {'$in': [testString4, testString2]}},
			}
		},
	},
	{
		description: 'Query ARRAY CONTAINS ANY',
		result: [testInstance3, testInstance4, testInstance5],
		input: {
			query: {
				where: {stringArray: {'$aca': [testString4]}},
			}
		},
	},
	{
		description: 'Query ARRAY CONTAINS',
		result: [testInstance3, testInstance4, testInstance5],
		input: {
			query: {
				where: {stringArray: {'$ac': testString4}},
			}
		},
	},
	{
		description: 'Query ARRAY CONTAINS - Order "asc" by number',
		result: [testInstance3, testInstance4, testInstance5],
		input: {
			query: {
				where: {stringArray: {'$ac': testString4}},
				orderBy: [{key: 'numeric', order: 'asc'}],
			}
		},
	},
	{
		description: 'Query ARRAY CONTAINS - Order "asc" by string',
		result: [testInstance3, testInstance4, testInstance5],
		input: {
			query: {
				where: {stringArray: {'$ac': testString4}},
				orderBy: [{key: 'stringValue', order: 'asc'}],
			}
		},
	},
	{
		description: 'Query ARRAY CONTAINS - Order "desc" by number',
		result: [testInstance5, testInstance4, testInstance3],
		input: {
			query: {
				where: {stringArray: {'$ac': testString4}},
				orderBy: [{key: 'numeric', order: 'desc'}],
			}
		},
	},
	{
		description: 'Query ARRAY CONTAINS - Order "desc" by string',
		result: [testInstance5, testInstance4, testInstance3],
		input: {
			query: {
				where: {stringArray: {'$ac': testString4}},
				orderBy: [{key: 'stringValue', order: 'desc'}],
			}
		},
	},
	{
		description: 'Query SELECT string prop',
		result: [
			{stringValue: testInstance3.stringValue, numeric: testInstance3.numeric},
			{stringValue: testInstance4.stringValue, numeric: testInstance4.numeric},
			{stringValue: testInstance5.stringValue, numeric: testInstance5.numeric}
		],
		input: {
			query: {
				where: {stringArray: {'$ac': testString4}},
				select: ['stringValue', 'numeric'],
			}
		},
	},
	{
		description: 'Query array of objects',
		result: [testInstance1, testInstance2, testInstance5],
		input: {
			query: {
				where: {objectArray: {$ac: {key: testItem1.key, value: testItem1.value}}},
			}
		},
	},
	{
		description: 'Query nested object',
		result: [testInstance1],
		input: {
			query: {
				where: {nestedObject: {one: testItem1}},
			}
		},
	},
	{
		description: 'Query nested by key and value',
		result: [testInstance2],
		input: {
			query: {
				where: {nestedObject: {two: {value: testNumber3}}},
			}
		},
	},
	{
		description: 'Query nested by key and value $gt',
		result: [testInstance2, testInstance3, testInstance4, testInstance5],
		input: {
			query: {
				where: {nestedObject: {two: {value: {$gt: testNumber2}}}},
			}
		},
	},
	{
		description: 'Query nested by Array Contains',
		result: [testInstance1, testInstance2, testInstance5],
		input: {
			query: {
				where: {objectArray: {$ac: testItem1}},
			}
		},
	},
	{
		description: 'Query not equals to',
		result: [testInstance1, testInstance3, testInstance4, testInstance5],
		input: {
			query: {
				where: {stringValue: {$neq: testString2}},
			}
		},
	},
	{
		description: 'Query not-in',
		result: [testInstance1, testInstance5],
		input: {
			query: {
				where: {stringValue: {$nin: [testString2, testString3, testString4]}},
			}
		},
	},
];

export const TestSuit_FB_Query: Test = {
	label: 'Firestore query tests',
	testcases: TestCases_FB_Query,
	preProcessor: async () => {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		const collection = firestore.getCollection('firestore-query-tests');
		await collection.deleteAll();
		await collection.insertAll(allTestItems);
	},
	processor: async (testCase) => {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		const collection = firestore.getCollection('firestore-query-tests');
		if (testCase.input.test)
			return await testCase.input.test(collection, testCase);

		let items = await collection.query(testCase.input.query);
		if (!testCase.input.query.orderBy)
			items = sortArray(items, i => i.numeric);
		expect(items).to.eql(testCase.result);
	},
};