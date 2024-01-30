import * as chai from 'chai';
import {expect} from 'chai';
import {firestore, testInstance1, testInstance2, testInstance3} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {
	asArray,
	compare,
	DBDef,
	deepClone,
	PreDB,
	removeDBObjectKeys,
	sortArray,
	tsValidateMustExist
} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {updatedStringValue1, updatedStringValue2} from '../update/update';
import {_EmptyQuery} from '../../../main';

chai.use(require('chai-as-promised'));


type Input = {
	upsertAction: (collection: FirestoreCollectionV2<DB_Type>, inserted: DB_Type[]) => Promise<void>
	toCreate: PreDB<DB_Type>[]
}

type Result = () => { created?: PreDB<DB_Type>[], updated?: PreDB<DB_Type>[], notUpdated?: PreDB<DB_Type>[] };
type Test = TestSuite<Input, Result>; //result - the items left in the collection after deletion

const dbDef: DBDef<DB_Type> = {
	dbName: 'firestore-upsert-tests',
	entityName: 'upsert-test',
	validator: tsValidateMustExist
};

export const TestCases_FB_Upsert: Test['testcases'] = [
	{
		description: 'upsert new item',
		result: () => {
			return {created: [deepClone(testInstance1)]};
		},
		input: {
			toCreate: [],
			upsertAction: async (collection, inserted) => {
				await collection.upsert.item(deepClone(testInstance1));
			}
		}
	},
	{
		description: 'upsert existing item',
		result: () => {
			const _instance = deepClone(testInstance1);
			_instance.stringValue = updatedStringValue1;
			return {updated: [_instance]};
		},
		input: {
			toCreate: [testInstance1],
			upsertAction: async (collection, inserted) => {
				inserted[0].stringValue = updatedStringValue1;
				await collection.upsert.item(inserted[0]);
			}
		}
	},
	{
		description: 'upsert 3 new items',
		result: () => {
			return {created: deepClone([testInstance1, testInstance2, testInstance3])};
		},
		input: {
			toCreate: [],
			upsertAction: async (collection, inserted) => {
				await collection.upsert.all(deepClone([testInstance1, testInstance2, testInstance3]));
			}
		}
	},
	{
		description: 'upsert 3 existing items',
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
			upsertAction: async (collection, inserted) => {
				const _test1 = inserted.find(_item => _item._uniqueId === testInstance1._uniqueId)!;
				const _test2 = inserted.find(_item => _item._uniqueId === testInstance2._uniqueId)!;
				await collection.upsert.all([{..._test1, stringValue: updatedStringValue1}, {
					..._test2,
					stringValue: updatedStringValue2
				}]);
			}
		}
	},
	{
		description: 'insert 1 & upsert empty object',
		result: () => {
			return {updated: [deepClone(testInstance1)]};
		},
		input: {
			toCreate: [testInstance1],
			upsertAction: async (collection, inserted) => {
				await collection.upsert.item({_id: inserted[0]._id});
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
			upsertAction: async (collection, inserted) => {
				await collection.upsert.all(inserted.map(_item => ({_id: _item._id})));
			}
		}
	},
];

export const TestSuite_FirestoreV2_Upsert: Test = {
	label: 'Firestore upsert tests',
	testcases: TestCases_FB_Upsert,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(dbDef);
		await collection.deleteCollection();

		const toInsert = deepClone(testCase.input.toCreate);
		const inserted = await collection.create.all(asArray(toInsert));

		await testCase.input.upsertAction(collection, deepClone(inserted));

		const sortedRemaining = sortArray((await collection.query.custom(_EmptyQuery)), item => item._uniqueId);
		const sortedInserted = sortArray(inserted, item => item._uniqueId);

		const result = testCase.result();
		const allResults = sortArray([...result.created ?? [], ...result.updated ?? [], ...result.notUpdated ?? []], item => item._uniqueId);

		//assert items have been updated correctly
		expect(true).to.eql(compare(sortedRemaining.map(removeDBObjectKeys), allResults));
		//assert timestamps correctly updated
		result.updated?.forEach((_preDBUpdated) => {
			const _itemIndex = sortedRemaining.findIndex(_item => _item._uniqueId === _preDBUpdated._uniqueId);
			expect(sortedInserted[_itemIndex].__created).to.eql(sortedRemaining[_itemIndex].__created);
			expect(sortedInserted[_itemIndex].__updated).to.be.lte(sortedRemaining[_itemIndex].__updated);
		});
		result.notUpdated?.forEach((_preDBNotUpdated) => {
			const _itemIndex = sortedRemaining.findIndex(_item => _item._uniqueId === _preDBNotUpdated._uniqueId);
			expect(sortedInserted[_itemIndex].__created).to.eql(sortedRemaining[_itemIndex].__created);
			expect(sortedInserted[_itemIndex].__updated).to.eql(sortedRemaining[_itemIndex].__updated);
		});
	}
};