import * as chai from 'chai';
import {expect} from 'chai';
import {firestore, testInstance1, testInstance2, testInstance3} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {asArray, compare, DBDef, deepClone, PreDB, removeDBObjectKeys, sortArray, tsValidateMustExist} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {_EmptyQuery} from '../../../main';


chai.use(require('chai-as-promised'));


type Input = {
	updateAction: (collection: FirestoreCollectionV2<DB_Type>, inserted: DB_Type[]) => Promise<void>
	toCreate: PreDB<DB_Type>[]
}
type Result = () => { updated: PreDB<DB_Type>[], notUpdated?: PreDB<DB_Type>[] };
type Test = TestSuite<Input, Result>; //result - the items left in the collection after deletion
type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

const dbDef: DBDef<DB_Type> = {
	dbName: 'firestore-update-tests',
	entityName: 'update-test',
	validator: tsValidateMustExist
};

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
	},
	// {
	// 	description: 'insert 1 & update 1 field in transaction',
	// 	result: () => {
	// 		const _instance = deepClone(testInstance1);
	// 		return {updated: [{..._instance, stringValue: updatedStringValue1}]};
	// 	},
	// 	input: {
	// 		toCreate: [testInstance1],
	// 		updateAction: async (collection, inserted) => {
	// 			await collection.runTransaction(async (transaction) => {
	// 				await collection.update.item({_id: inserted[0]._id!, stringValue: updatedStringValue1},transaction);
	// 			});
	// 		}
	// 	}
	// },
	{
		description: 'insert 1 & update multiple fields',
		result: () => {
			const _instance = deepClone(testInstance1);
			return {
				updated: [{
					..._instance,
					stringValue: updatedStringValue1,
					numeric: 1000,
					stringArray: [updatedStringValue1, updatedStringValue1]
				}]
			};
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
	// {
	// 	description: 'insert 1 & delete nested field in transaction',
	// 	result: () => {
	// 		const _instance: DeepPartial<PreDB<DB_Type>> = deepClone(testInstance1);
	// 		delete _instance.nestedObject!.one!.key;
	// 		return {updated: [_instance as PreDB<DB_Type>]};
	// 	},
	// 	input: {
	// 		toCreate: [testInstance1],
	// 		updateAction: async (collection, inserted) => {
	// 			await collection.runTransaction(async (transaction) => {
	// 				await collection.update.item({_id: inserted[0]._id!, 'nestedObject.one.key': undefined},transaction);
	// 			});
	// 		}
	// 	}
	// },
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
				updated: [{..._instance1, stringValue: updatedStringValue1}, {
					..._instance2,
					stringValue: updatedStringValue2
				}], notUpdated: [deepClone(testInstance3)]
			};
		},
		input: {
			toCreate: [testInstance1, testInstance2, testInstance3],
			updateAction: async (collection, inserted) => {
				const _test1 = inserted.find(_item => _item._uniqueId === testInstance1._uniqueId);
				const _test2 = inserted.find(_item => _item._uniqueId === testInstance2._uniqueId);
				await collection.update.all([{_id: _test1!._id, stringValue: updatedStringValue1}, {
					_id: _test2!._id,
					stringValue: updatedStringValue2
				}]);
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
		const collection = firestore.getCollection<DB_Type>(dbDef);
		await collection.deleteCollection();

		const toInsert = deepClone(testCase.input.toCreate);
		const inserted = await collection.create.all(asArray(toInsert));

		await testCase.input.updateAction(collection, deepClone(inserted));

		const sortedRemaining = sortArray((await collection.query.custom(_EmptyQuery)), item => item._uniqueId);
		const sortedInserted = sortArray(inserted, item => item._uniqueId);

		const result = testCase.result();
		const allResults = sortArray([...result.updated, ...result.notUpdated ?? []], item => item._uniqueId);

		//assert items have been updated correctly
		expect(true).to.eql(compare(sortedRemaining.map(removeDBObjectKeys), allResults));
		//assert __created didn't change
		expect(true).to.eql(sortedRemaining.every((_item, i) => _item.__created === sortedInserted[i].__created));
		//assert result.updated timestamps correctly updated
		result.updated.forEach((_preDBUpdated) => {
			const _itemIndex = sortedRemaining.findIndex(_item => _item._uniqueId === _preDBUpdated._uniqueId);
			expect(sortedInserted[_itemIndex].__updated).to.be.lte(sortedRemaining[_itemIndex].__updated);
		});
		result.notUpdated?.forEach((_preDBNotUpdated) => {
			const _itemIndex = sortedRemaining.findIndex(_item => _item._uniqueId === _preDBNotUpdated._uniqueId);
			expect(sortedInserted[_itemIndex].__updated).to.eql(sortedRemaining[_itemIndex].__updated);
		});
	}
};
