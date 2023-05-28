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

const TestSuit_DB_Query: Test['testcases'] = [
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
	testcases: TestSuit_DB_Query,
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