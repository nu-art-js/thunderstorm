import * as chai from 'chai';
import {expect} from 'chai';
import {firestore, testInstance1} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, deepClone, PreDB, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';


chai.use(require('chai-as-promised'))


type Input = {
	updateAction: (collection: FirestoreCollectionV2<DB_Type>, inserted: DB_Type[]) => Promise<void>
	toInsert: PreDB<DB_Type>[]
}
type Test = TestSuite<Input, () => PreDB<DB_Type>[]>; //result - the items left in the collection after deletion
type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

export const updatedStringValue = 'test update';

export const TestCases_FB_Update: Test['testcases'] = [
	{
		description: 'insert 1 & update 1 field',
		result: () => {
			const _instance = deepClone(testInstance1);
			_instance.stringValue = updatedStringValue;
			return [_instance];
		},
		input: {
			toInsert: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update(inserted[0]._id!, {stringValue: updatedStringValue});
			}
		}
	},
	{
		description: 'insert 1 & delete 1 field',
		result: () => {
			const _instance: DeepPartial<PreDB<DB_Type>> = deepClone(testInstance1);
			delete _instance.stringValue;
			return [_instance as PreDB<DB_Type>];
		},
		input: {
			toInsert: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update(inserted[0]._id!, {stringValue: undefined});
			}
		}
	},
	{
		description: 'insert 1 & update 1 nested field (dot notation)',
		result: () => {
			const _instance = deepClone(testInstance1);
			_instance.nestedObject!.one.key = updatedStringValue;
			return [_instance];
		},
		input: {
			toInsert: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update(inserted[0]._id!, {'nestedObject.one.key': updatedStringValue});
			}
		}
	},
	{
		description: 'insert 1 & update nested field (without dot notation)',
		result: () => {
			const _instance: DeepPartial<PreDB<DB_Type>> = deepClone(testInstance1);
			_instance.nestedObject!.one!.key = updatedStringValue;
			delete _instance.nestedObject!.one!.value;
			delete _instance.nestedObject!.two;
			return [_instance as PreDB<DB_Type>];
		},
		input: {
			toInsert: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update(inserted[0]._id!, {nestedObject: {one: {key: updatedStringValue}}});
			}
		}
	},
];

export const TestSuite_FirestoreV2_Update: Test = {
	label: 'Firestore update tests',
	testcases: TestCases_FB_Update,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-deletion-tests');
		await collection.deleteCollection();

		const toInsert = deepClone(testCase.input.toInsert);
		const inserted = await collection.create.all(Array.isArray(toInsert) ? toInsert : [toInsert]);

		await testCase.input.updateAction(collection, inserted);
		const remainingDBItems = await collection.query.all({where: {}});
		expect(true).to.eql(compare(sortArray(remainingDBItems.map(removeDBObjectKeys), item => item.stringValue), sortArray(testCase.result(), item => item.stringValue)));
	}
};
