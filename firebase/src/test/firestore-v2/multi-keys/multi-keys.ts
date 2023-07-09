import * as chai from 'chai';
import {expect} from 'chai';
import {firestore} from '../_core/consts';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {DB_Object, DBDef, deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {composeItemId, FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';


chai.use(require('chai-as-promised'));

type DB_Type = DB_Object & { aKey: string, bKey: number }

type Input = (collection: FirestoreCollectionV2<DB_Type, 'aKey' | 'bKey'>) => Promise<any>

type Test = TestSuite<Input, PreDB<DB_Type>[]>; //result - the items left in the collection after deletion

const dbDef: DBDef<DB_Type, 'aKey' | 'bKey'> = {
	dbName: 'firestore-multiKeys',
	uniqueKeys: ['aKey', 'bKey'],
	entityName: 'multikeys-test',
	validator: tsValidateMustExist
};

const sampleDoc1 = Object.freeze({aKey: 'aaaa', bKey: 9, content: 'content1'});
const compareId = (origin: PreDB<DB_Type>, target: DB_Type) => {
	expect(composeItemId(origin, dbDef.uniqueKeys!)).to.eql(target._id);
};

export const TestCases_FB_MultiKeys: Test['testcases'] = [
	{
		description: 'create one item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV2<DB_Type, 'aKey' | 'bKey'>) => {
			const dbItem = await collection.create.item(deepClone(sampleDoc1));
			compareId(sampleDoc1, dbItem);
		}
	},
	{
		description: 'create duplicate item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV2<DB_Type, 'aKey' | 'bKey'>) => {
			const toOverrideWith = {...sampleDoc1, content: 'content2'};
			await collection.create.item(deepClone(sampleDoc1));
			await expect(collection.create.item(deepClone(toOverrideWith))).to.be.rejectedWith(Error);
		}
	},
	{
		description: 'set one item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV2<DB_Type, 'aKey' | 'bKey'>) => {
			const dbItem = await collection.set.item(deepClone(sampleDoc1));
			compareId(sampleDoc1, dbItem);
		}
	},
	{
		description: 'set and re-set an item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV2<DB_Type, 'aKey' | 'bKey'>) => {
			const toOverrideWith = {...sampleDoc1, content: 'content2'};
			await collection.create.item(deepClone(sampleDoc1));
			await expect(collection.set.item(deepClone(toOverrideWith))).to.be.rejected;

			// const dbItem1 = await collection.create.item(deepClone(sampleDoc1));
			// const dbItem2 = await collection.set.item(deepClone(toOverrideWith));
			// console.log(dbItem1, dbItem2);
			// compareId(dbItem1, dbItem2);
		}
	},
	{
		description: 'create same two items',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV2<DB_Type, 'aKey' | 'bKey'>) => {
			const item1 = deepClone(sampleDoc1);
			const item2 = {...sampleDoc1, content: 'content2'};
			await expect(collection.create.all([item1, item2])).to.be.rejectedWith(Error);
		}
	},
	{
		description: 'create one item - set all with same item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV2<DB_Type, 'aKey' | 'bKey'>) => {
			const item1 = deepClone(sampleDoc1);
			const item2 = {...sampleDoc1, content: 'content2'};
			await collection.create.item(deepClone(sampleDoc1));
			await expect(collection.set.all([item1, item2])).to.be.rejectedWith(Error);
		}
	},
];

export const TestSuite_FirestoreV2_MultiKeys: Test = {
	label: 'Firestore Multi-Keys',
	testcases: TestCases_FB_MultiKeys,
	processor: async (testCase) => {
		const collection = firestore.getCollection(dbDef);
		await collection.deleteCollection();

		await testCase.input(collection);
	}
};

