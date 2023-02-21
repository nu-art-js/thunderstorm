import {expect} from 'chai';
import {FirestoreCollection, ModuleBE_Firebase} from '../../main/backend';
import {testInstance1, testInstance2, testInstance3, testInstance4, testInstance5, testString1} from './_core/consts';
import {FB_Type} from './_core/types';
import {TestSuit, expectFailAsync} from '@nu-art/ts-common/test-index';
import {compare, sortArray} from '@nu-art/ts-common';

type Input = {
	value: FB_Type[];
	check: (collection: FirestoreCollection<any>, expectedItem?: FB_Type | FB_Type[]) => Promise<void>
}

type Test = TestSuit<Input, FB_Type | FB_Type[] | undefined>;

export const TestCases_FB_Insert: Test['testcases'] = [
	{
		description: 'Insert & Query - one item',
		result: testInstance1,
		input: {
			value: [testInstance1],
			check: async (collection, expectedItem) => {
				const items = await collection.getAll();
				expect(items.length).to.eql(1);
				expect(items[0]).to.eql(expectedItem);
			}
		}
	},
	{
		description: 'Insert & Query (unique) - one item',
		result: testInstance1,
		input: {
			value: [testInstance1],
			check: async (collection, expectedItem) => {
				const item = await collection.queryUnique({where: {stringValue: testString1}});
				expect(item).to.eql(expectedItem);
			}
		}
	},
	{
		description: 'Insert two items, query unique, expect fail (too many results)',
		result: undefined,
		input: {
			value: [testInstance1, testInstance1],
			check: async (collection) => {
				(await expectFailAsync(() => collection.queryUnique({where: {stringValue: testString1}}))).to.throw('too many results');
			}
		}
	},
	{
		description: 'Insert & Query - five items',
		result: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				let items = await collection.getAll() as FB_Type[];
				expect(items.length).to.eql(5);
				items = sortArray(items, item => item.numeric);
				(expectedResult as FB_Type[]).forEach((res, i) => {
					const index = items.findIndex(item => item.numeric === res.numeric);
					expect(index).to.eql(i);
				});
			}
		}
	},
	{
		description: 'Insert & Query - two same items',
		result: undefined,
		input: {
			value: [testInstance1, testInstance1],
			check: async (collection) => {
				const items = await collection.getAll();
				expect(items.length).to.eql(2);
				expect(compare(items[0], items[1])).to.eql(true);
			}
		}
	}
];

export const TestSuit_FB_Insert: Test = {
	label: 'Firestore insertion tests',
	testcases: TestCases_FB_Insert,
	processor: async (testCase) => {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		const collection = firestore.getCollection('firestore-insertion-tests');
		await collection.deleteAll();
		await collection.insertAll(testCase.input.value);
		await testCase.input.check(collection, testCase.result);
	}
};
