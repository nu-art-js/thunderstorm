import {compare, TestSuitAsync_V2} from '@nu-art/ts-common';
import {FirestoreCollection, ModuleBE_Firebase} from '../../../main/backend';
import {testInstance1, testString1} from '../_core/consts';


type Input = {
	collectionName: string,
	value: any
	check: (collection: FirestoreCollection<any>) => Promise<boolean>
}
type TestSuit_TS_FB_insert = TestSuitAsync_V2<Input, any>
export const TestCase_ts_FB_insert: TestSuit_TS_FB_insert ['testcases'] = [
	{
		description: 'Insert and query - one item',
		result: true,
		input: {
			collectionName: 'zevel',
			value: testInstance1,
			check: async (collection: FirestoreCollection<any>) => {
				const items = await collection.getAll();
				if (items.length !== 1)
					throw new Error('blah');

				// assert('Expected only one item', items.length, 1);
				// assert('Inserted object and queried object don\'t match', items[0], testInstance1);

				return compare([testInstance1], items);
			}
		}
	},
	{
		description: 'Insert and query unique - one item',
		result: true,
		input: {
			collectionName: 'zevel',
			value: testInstance1,
			check: async (collection: FirestoreCollection<any>) => {
				const item = await collection.queryUnique({where: {stringValue: testString1}});

				return compare(testInstance1, item);
			}
		}
	}
];

export const TestSuit_ts_FB_insert: TestSuit_TS_FB_insert = {
	label: 'Insert into FIRESTORE',
	testcases: TestCase_ts_FB_insert,
	processor: async (input) => {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		const collection = firestore.getCollection(input.collectionName);
		await collection.deleteAll();
		await collection.insert(input.value);
		return await input.check(collection);
	}
};
