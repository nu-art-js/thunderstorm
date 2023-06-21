import * as chai from 'chai';
import {expect} from 'chai';
import {firestore, testInstance1} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, deepClone, PreDB, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {updatedStringValue} from '../update/update';

chai.use(require('chai-as-promised'));


type Input = {
	upsertAction: (collection: FirestoreCollectionV2<DB_Type>, inserted: DB_Type[]) => Promise<void>
	toCreate: PreDB<DB_Type>[]
}

type Test = TestSuite<Input, () => PreDB<DB_Type>[]>; //result - the items left in the collection after deletion

export const TestCases_FB_Upsert: Test['testcases'] = [
	{
		description: 'upsert new item',
		result: () => {
			return [deepClone(testInstance1)];
		},
		input: {
			toCreate: [],
			upsertAction: async (collection, inserted) => {
				await collection.upsert.single(deepClone(testInstance1));
			}
		}
	},
	{
		description: 'upsert existing item',
		result: () => {
			const _instance = deepClone(testInstance1);
			_instance.stringValue = updatedStringValue;
			return [_instance];
		},
		input: {
			toCreate: [testInstance1],
			upsertAction: async (collection, inserted) => {
				inserted[0].stringValue = updatedStringValue;
				await collection.upsert.single(inserted[0]);
			}
		}
	},
];

export const TestSuite_FirestoreV2_Upsert: Test = {
	label: 'Firestore upsert tests',
	testcases: TestCases_FB_Upsert,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-deletion-tests');
		await collection.deleteCollection();

		const toInsert = deepClone(testCase.input.toCreate);
		const inserted = await collection.create.all(Array.isArray(toInsert) ? toInsert : [toInsert]);

		await testCase.input.upsertAction(collection, inserted);
		const remainingDBItems = await collection.query.all({where: {}});
		expect(true).to.eql(compare(sortArray(remainingDBItems.map(removeDBObjectKeys), item => item.stringValue), sortArray(testCase.result(), item => item.stringValue)));
	}
};
