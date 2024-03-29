import * as chai from 'chai';
import {expect} from 'chai';
import {duplicateObjectToCreate, firestore, testInstance1, testInstance2, testInstance3, validateDBObject} from '../_core/consts';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {asArray, compare, DB_Object, DBDef_V3, deepClone, PreDB, removeDBObjectKeys, sortArray, tsValidateMustExist} from '@nu-art/ts-common';
import {_EmptyQuery} from '../../../main';
import {DB_Type, DBProto_Type} from '../_entity';
import {FirestoreCollectionV3} from '../../../main/backend/firestore-v3/FirestoreCollectionV3';


chai.use(require('chai-as-promised'));
export const updatedStringValue1 = 'test update';
export const updatedStringValue2 = 'test update 2';

const dbDef: DBDef_V3<DBProto_Type> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	dbKey: 'firestore-set-tests',
	entityName: 'set-test',
	versions: ['1.0.0'],
	frontend: {
		group: 'test',
		name: 'firestore-set-tests'
	},
	backend: {
		name: 'firestore-set-tests',
	}
};

type Input = {
	setAction: (collection: FirestoreCollectionV3<DBProto_Type>, inserted: DB_Type[]) => Promise<void>
	toCreate: PreDB<DB_Type>[]
}

type Result = () => { created?: PreDB<DB_Type>[], updated?: PreDB<DB_Type>[], notUpdated?: PreDB<DB_Type>[] };
type Test = TestSuite<Input, Result>; //result - the items left in the collection after deletion

export const TestCases_FB_Set: Test['testcases'] = [
	{
		description: 'set new item',
		result: () => {
			return {created: [deepClone(testInstance1)]};
		},
		input: {
			toCreate: [],
			setAction: async (collection, inserted) => {
				await collection.set.item(deepClone(testInstance1));
			}
		}
	},
	{
		description: 'set new item with id',
		result: () => {
			return {created: [duplicateObjectToCreate]};
		},
		input: {
			toCreate: [],
			setAction: async (collection, inserted) => {
				const resultObject = await collection.set.item(deepClone(duplicateObjectToCreate));
				validateDBObject(resultObject);
				expect(resultObject._id).to.eql(duplicateObjectToCreate._id);
			}
		}
	},
	{
		description: 'set new item in transaction',
		result: () => {
			return {created: [deepClone(testInstance1)]};
		},
		input: {
			toCreate: [],
			setAction: async (collection, inserted) => {
				await collection.runTransaction(async (transaction) => {
					await collection.set.item(deepClone(testInstance1), transaction);
				});
			}
		}
	},
	{
		description: 'set existing item',
		result: () => {
			const _instance = deepClone(testInstance1);
			_instance.stringValue = updatedStringValue1;
			return {updated: [_instance]};
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
			return {created: deepClone([testInstance1, testInstance2, testInstance3])};
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
			return {
				updated: [{..._instance1, stringValue: updatedStringValue1}, {
					..._instance2,
					stringValue: updatedStringValue2
				}], notUpdated: [deepClone(testInstance3)]
			};
		},
		input: {
			toCreate: [testInstance1, testInstance2, testInstance3],
			setAction: async (collection, inserted) => {
				const _test1 = inserted.find(_item => _item._uniqueId === testInstance1._uniqueId)!;
				const _test2 = inserted.find(_item => _item._uniqueId === testInstance2._uniqueId)!;
				await collection.set.all([{..._test1, stringValue: updatedStringValue1}, {
					..._test2,
					stringValue: updatedStringValue2
				}]);
			}
		}
	},
	{
		description: 'set 3 existing items in transaction',
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
			setAction: async (collection, inserted) => {
				await collection.runTransaction(async (transaction) => {
					const _test1 = inserted.find(_item => _item._uniqueId === testInstance1._uniqueId)!;
					const _test2 = inserted.find(_item => _item._uniqueId === testInstance2._uniqueId)!;
					await collection.set.all([{..._test1, stringValue: updatedStringValue1}, {
						..._test2,
						stringValue: updatedStringValue2
					}], transaction);
				});
			}
		}
	},
	{
		description: '2 items 1 _id',
		result: () => ({}),
		input: {
			toCreate: [],
			setAction: async (collection, inserted) => {
				const toSet = deepClone(duplicateObjectToCreate);
				const toSet2 = deepClone(duplicateObjectToCreate);

				await expect(collection.set.all([toSet, toSet2])).to.be.rejectedWith;
			}
		}
	}
];

export const TestSuite_FirestoreV3_Set: Test = {
	label: 'Firestore set tests',
	testcases: TestCases_FB_Set,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DBProto_Type>(dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		const toInsert = deepClone(testCase.input.toCreate);
		const inserted = await collection.create.all(asArray(toInsert));

		await testCase.input.setAction(collection, deepClone(inserted));

		const sortedRemaining = sortArray((await collection.query.custom(_EmptyQuery)), item => item._uniqueId);
		const sortedInserted = sortArray(inserted, item => item._uniqueId);

		const result = testCase.result();
		const allResults = sortArray([...result.created ?? [], ...result.updated ?? [], ...result.notUpdated ?? []], item => item._uniqueId);

		//assert items have been updated correctly
		expect(true).to.eql(compare(sortedRemaining.map(removeDBObjectKeys), (allResults as DB_Object[]).map(removeDBObjectKeys)));
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
