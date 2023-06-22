import * as chai from 'chai';
import {expect} from 'chai';
import {firestore, testInstance1, testInstance2, testInstance3} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, deepClone, PreDB, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';


chai.use(require('chai-as-promised'))


type Input = {
	updateAction: (collection: FirestoreCollectionV2<DB_Type>, inserted: DB_Type[]) => Promise<void>
	toCreate: PreDB<DB_Type>[]
}
type Result = () => { updated: PreDB<DB_Type>[], notUpdated?: PreDB<DB_Type>[] };
type Test = TestSuite<Input, Result>; //result - the items left in the collection after deletion
type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

export const updatedStringValue1 = 'test update';
export const updatedStringValue2 = 'test update 2';

export const TestCases_FB_Update: Test['testcases'] = [
	{
		description: 'insert 1 & update 1 field',
		result: () => {
			const _instance = deepClone(testInstance1);
			return {updated: [{..._instance, stringValue: updatedStringValue1}]};
		},
		input: {
			toCreate: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update.item({_id: inserted[0]._id!, stringValue: updatedStringValue1});
			}
		}
	}, {
		description: 'insert 1 & update multiple fields',
		result: () => {
			const _instance = deepClone(testInstance1);
			return {updated: [{..._instance, stringValue: updatedStringValue1, numeric: 1000, stringArray: [updatedStringValue1, updatedStringValue1]}]};
		},
		input: {
			toCreate: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update.item({
					_id: inserted[0]._id!,
					stringValue: updatedStringValue1,
					numeric: 1000,
					stringArray: [updatedStringValue1, updatedStringValue1]
				});
			}
		}
	},
	{
		description: 'insert 1 & delete 1 field',
		result: () => {
			const _instance: DeepPartial<PreDB<DB_Type>> = deepClone(testInstance1);
			delete _instance.stringValue;
			return {updated: [_instance as PreDB<DB_Type>]};
		},
		input: {
			toCreate: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update.item({_id: inserted[0]._id!, stringValue: undefined});
			}
		}
	},
	{
		description: 'insert 1 & delete nested field',
		result: () => {
			const _instance: DeepPartial<PreDB<DB_Type>> = deepClone(testInstance1);
			delete _instance.nestedObject!.one!.key;
			return {updated: [_instance as PreDB<DB_Type>]};
		},
		input: {
			toCreate: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update.item({_id: inserted[0]._id!, 'nestedObject.one.key': undefined});
			}
		}
	},
	{
		description: 'insert 1 & update 1 nested field (dot notation)',
		result: () => {
			const _instance = deepClone(testInstance1);
			_instance.nestedObject!.one.key = updatedStringValue1;
			return {updated: [_instance]};
		},
		input: {
			toCreate: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update.item({_id: inserted[0]._id!, 'nestedObject.one.key': updatedStringValue1});
			}
		}
	},
	{
		description: 'insert 1 & update nested field (without dot notation)',
		result: () => {
			const _instance: DeepPartial<PreDB<DB_Type>> = deepClone(testInstance1);
			_instance.nestedObject!.one!.key = updatedStringValue1;
			delete _instance.nestedObject!.one!.value;
			delete _instance.nestedObject!.two;
			return {updated: [_instance as PreDB<DB_Type>]};
		},
		input: {
			toCreate: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update.item({_id: inserted[0]._id!, nestedObject: {one: {key: updatedStringValue1}}});
			}
		}
	},
	{
		description: 'insert 3 & update 2',
		result: () => {
			const _instance1 = deepClone(testInstance1);
			const _instance2 = deepClone(testInstance2);
			return {
				updated: [{..._instance1, stringValue: updatedStringValue1}, {..._instance2, stringValue: updatedStringValue2}], notUpdated: [deepClone(testInstance3)]
			};
		},
		input: {
			toCreate: [testInstance1, testInstance2, testInstance3],
			updateAction: async (collection, inserted) => {
				const _test1 = inserted.find(_item => _item.stringValue === testInstance1.stringValue);
				const _test2 = inserted.find(_item => _item.stringValue === testInstance2.stringValue);
				await collection.update.all([{_id: _test1!._id, stringValue: updatedStringValue1}, {_id: _test2!._id, stringValue: updatedStringValue2}]);
			}
		}
	},
	{
		description: 'insert 1 & update empty object',
		result: () => {
			return {updated: [deepClone(testInstance1)]};
		},
		input: {
			toCreate: [testInstance1],
			updateAction: async (collection, inserted) => {
				await collection.update.item({_id: inserted[0]._id});
			}
		}
	},
	{
		description: 'insert 3 & update empty object',
		result: () => {
			return {updated: deepClone([testInstance1, testInstance2, testInstance3])};
		},
		input: {
			toCreate: [testInstance1, testInstance2, testInstance3],
			updateAction: async (collection, inserted) => {
				await collection.update.all(inserted.map(_item => ({_id: _item._id})));
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

		const toInsert = deepClone(testCase.input.toCreate);
		const inserted = await collection.create.all(Array.isArray(toInsert) ? toInsert : [toInsert]);

		await testCase.input.updateAction(collection, inserted);

		const sortedRemaining = sortArray((await collection.query.custom({where: {}})), item => item.stringValue);
		const sortedInserted = sortArray(inserted, item => item.stringValue);

		const result = testCase.result();
		const sortedResult = sortArray([...result.updated, ...result.notUpdated ?? []], item => item.stringValue);

		//assert items have been updated correctly
		expect(true).to.eql(compare(sortedRemaining.map(removeDBObjectKeys), sortedResult));
		//assert __created didn't change
		expect(true).to.eql(sortedRemaining.every((_item, i) => _item.__created === sortedInserted[i].__created));
		//assert result.updated timestamps correctly updated
		result.updated.forEach((_preDBUpdated) => {
			const _itemIndex = sortedRemaining.findIndex(_item => _item.stringValue === _preDBUpdated.stringValue);
			expect(sortedInserted[_itemIndex].__updated).to.be.lt(sortedRemaining[_itemIndex].__updated);
		})
		result.notUpdated?.forEach((_preDBNotUpdated) => {
			const _itemIndex = sortedRemaining.findIndex(_item => _item.stringValue === _preDBNotUpdated.stringValue);
			expect(sortedInserted[_itemIndex].__updated).to.eql(sortedRemaining[_itemIndex].__updated);
		})
	}
};

