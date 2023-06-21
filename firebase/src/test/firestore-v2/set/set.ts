import * as chai from 'chai';
import {expect} from 'chai';
import {firestore, testInstance1, testInstance2, testInstance3} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, deepClone, PreDB, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {updatedStringValue1, updatedStringValue2} from "../update/update";

chai.use(require('chai-as-promised'));


type Input = {
	setAction: (collection: FirestoreCollectionV2<DB_Type>, inserted: DB_Type[]) => Promise<void>
	toCreate: PreDB<DB_Type>[]
}

type Test = TestSuite<Input, () => PreDB<DB_Type>[]>; //result - the items left in the collection after deletion

export const TestCases_FB_Set: Test['testcases'] = [
	{
		description: 'set new item',
		result: () => {
			return [deepClone(testInstance1)];
		},
		input: {
			toCreate: [],
			setAction: async (collection, inserted) => {
				await collection.set.item(deepClone(testInstance1));
			}
		}
	},
	{
		description: 'set existing item',
		result: () => {
			const _instance = deepClone(testInstance1);
			_instance.stringValue = updatedStringValue1;
			return [_instance];
		},
		input: {
			toCreate: [testInstance1],
			setAction: async (collection, inserted) => {
				inserted[0].stringValue = updatedStringValue1;
				await collection.set.item(inserted[0]);
			}
		}
	},
	{
		description: 'set 3 new items',
		result: () => {
			return deepClone([testInstance1, testInstance2, testInstance3]);
		},
		input: {
			toCreate: [],
			setAction: async (collection, inserted) => {
				await collection.set.all(deepClone([testInstance1, testInstance2, testInstance3]));
			}
		}
	},
	{
		description: 'set 3 existing items',
		result: () => {
			const _instance1 = deepClone(testInstance1);
			const _instance2 = deepClone(testInstance2);
			return [{..._instance1, stringValue: updatedStringValue1}, {..._instance2, stringValue: updatedStringValue2}, deepClone(testInstance3)];
		},
		input: {
			toCreate: [testInstance1, testInstance2, testInstance3],
			setAction: async (collection, inserted) => {
				const _test1 = inserted.find(_item => _item.stringValue === testInstance1.stringValue)!;
				const _test2 = inserted.find(_item => _item.stringValue === testInstance2.stringValue)!;
				await collection.set.all([{..._test1, stringValue: updatedStringValue1}, {..._test2, stringValue: updatedStringValue2}]);
			}
		}
	},
];

export const TestSuite_FirestoreV2_Set: Test = {
	label: 'Firestore set tests',
	testcases: TestCases_FB_Set,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-deletion-tests');
		await collection.deleteCollection();

		const toCreate = deepClone(testCase.input.toCreate);
		const inserted = await collection.create.all(Array.isArray(toCreate) ? toCreate : [toCreate]);

		await testCase.input.setAction(collection, inserted);
		const remainingDBItems = await collection.query.custom({where: {}});
		expect(true).to.eql(compare(sortArray(remainingDBItems.map(removeDBObjectKeys), item => item.stringValue), sortArray(testCase.result(), item => item.stringValue)));
	}
};
