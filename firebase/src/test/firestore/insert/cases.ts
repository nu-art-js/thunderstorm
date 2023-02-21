import {expect} from 'chai';
import {FirestoreCollection, ModuleBE_Firebase} from '../../../main/backend';
import {testInstance1, testString1} from '../_core/consts';
import {FB_Type} from '../_core/types';
import {TestSuit} from '@nu-art/ts-common/testing/test-case';


type Input = {
	collectionName: string,
	value: FB_Type;
	check: (collection: FirestoreCollection<any>, expectedItem: FB_Type) => Promise<void>
}


export const TestCase_ts_FB_insert: TestSuit<Input, FB_Type> ['testcases'] = [
	{
		description: 'Insert one item and find in getAll[0]',
		result: testInstance1,
		input: {
			collectionName: 'zevel',
			value: testInstance1,
			check: async (collection, expectedItem) => {
				const items = await collection.getAll();
				expect(items.length).to.eql(1);
				expect(items[0]).to.eql(expectedItem);
			}
		}
	},
	{
		description: 'Insert one item and find with queryUnique',
		result: testInstance1,
		input: {
			collectionName: 'zevel',
			value: testInstance1,
			check: async (collection, expectedItem) => {
				const item = await collection.queryUnique({where: {stringValue: testString1}});
				expect(item).to.eql(expectedItem);
			}
		}
	}
];

export const TestSuit_ts_FB_insert: TestSuit<Input, any> = {
	label: 'Firestore insertion tests',
	testcases: TestCase_ts_FB_insert,
	processor: async (testCase) => {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		const collection = firestore.getCollection(testCase.input.collectionName);
		await collection.deleteAll();
		await collection.insert(testCase.input.value);
		await testCase.input.check(collection, testCase.result);
	}
};
