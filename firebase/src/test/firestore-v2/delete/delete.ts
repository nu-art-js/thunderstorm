import * as chai from 'chai';
import {expect} from 'chai';
import {firestore, testInstance1, testInstance2, testInstance3, testString1} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, DBDef, deepClone, generateHex, MUSTNeverHappenException, PreDB, removeDBObjectKeys, sortArray, tsValidateMustExist} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';

chai.use(require('chai-as-promised'))


type Input = {
	deleteAction: (collection: FirestoreCollectionV2<DB_Type>, inserted: DB_Type[]) => Promise<void>
	toInsert: PreDB<DB_Type>[]
}

type Test = TestSuite<Input, PreDB<DB_Type>[]>; //result - the items left in the collection after deletion

const dbDef: DBDef<DB_Type> = {
	dbName: 'firestore-delete-tests',
	entityName: 'delete-test',
	validator: tsValidateMustExist
}

export const TestCases_FB_Delete: Test['testcases'] = [
	{
		description: 'insert 1 & delete.unique',
		result: [],
		input: {
			toInsert: [testInstance1],
			deleteAction: async (collection, inserted) => {
				await collection.delete.unique(inserted[0]._id!);
			}
		}
	},
	{
		description: 'insert 1 & delete.item',
		result: [],
		input: {
			toInsert: [testInstance1],
			deleteAction: async (collection, inserted) => {
				await collection.delete.item(inserted[0]);
			}
		}
	},
	{
		description: 'insert 3 & delete.all',
		result: [],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			deleteAction: async (collection, inserted) => {
				await collection.delete.all(inserted.map(_item => _item._id));
			}
		}
	},
	{
		description: 'insert 3 & delete.allItems',
		result: [],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			deleteAction: async (collection, inserted) => {
				await collection.delete.allItems(inserted);
			}
		}
	},
	{
		description: 'insert 3 & delete.unique 1',
		result: [testInstance2, testInstance3],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			deleteAction: async (collection, inserted) => {
				const _testInstance1 = inserted.find(_item => _item.stringValue === testString1)!;
				await collection.delete.unique(_testInstance1._id);
			}
		}
	},
	{
		description: 'insert 3 & delete.item 1',
		result: [testInstance2, testInstance3],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			deleteAction: async (collection, inserted) => {
				const _testInstance1 = inserted.find(_item => _item.stringValue === testString1)!;
				await collection.delete.item(_testInstance1);
			}
		}
	},
	{
		description: 'insert 1 & delete.unique random _id',
		result: [testInstance1],
		input: {
			toInsert: [testInstance1],
			deleteAction: async (collection, inserted) => {
				await collection.delete.unique(generateHex(32));
			}
		}
	},
	{
		description: 'insert 1 & delete.unique empty string',
		result: [testInstance1],
		input: {
			toInsert: [testInstance1],
			deleteAction: async (collection, inserted) => {
				await expect(collection.delete.unique('')).to.be.rejectedWith(MUSTNeverHappenException);
			}
		}
	},
	{
		description: 'insert 3 & delete.all empty array',
		result: [testInstance1, testInstance2, testInstance3],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			deleteAction: async (collection, inserted) => {
				await collection.delete.all([]);
			}
		}
	},
	{
		description: 'insert 3 & delete.allItems empty array',
		result: [testInstance1, testInstance2, testInstance3],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			deleteAction: async (collection, inserted) => {
				await collection.delete.allItems([]);
			}
		}
	},
	{
		description: 'delete.all empty query',
		result: [testInstance1, testInstance2, testInstance3],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			deleteAction: async (collection, inserted) => {
				await expect(collection.delete.query({where: {}})).to.be.rejectedWith(MUSTNeverHappenException);
			}
		}
	},
	{
		description: 'delete.allItems empty query',
		result: [testInstance1, testInstance2, testInstance3],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			deleteAction: async (collection, inserted) => {
				await expect(collection.delete.query({where: {}})).to.be.rejectedWith(MUSTNeverHappenException);
			}
		}
	},
];

export const TestSuite_FirestoreV2_Delete: Test = {
	label: 'Firestore delete tests',
	testcases: TestCases_FB_Delete,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(dbDef);
		await collection.deleteCollection();

		const toInsert = deepClone(testCase.input.toInsert);
		const inserted = await collection.create.all(Array.isArray(toInsert) ? toInsert : [toInsert]);

		await testCase.input.deleteAction(collection, inserted);
		const remainingDBItems = await collection.query.custom({where: {}});
		expect(true).to.eql(compare(sortArray(remainingDBItems.map(removeDBObjectKeys), item => item.stringValue), sortArray(testCase.result, item => item.stringValue)));
	}
};
