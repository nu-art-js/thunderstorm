import * as chai from 'chai';
import {expect} from 'chai';
import {firestore, validateDBObject} from '../_core/consts';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {DBDef_V3, deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {composeDbObjectUniqueId} from '../../../main';
import {DB_Type_MultiKey, DBProto_Type_MultiKey} from '../../_entity/type-multi-key/shared';
import {FirestoreCollectionV3} from '../../../main/backend/firestore-v3/FirestoreCollectionV3';


chai.use(require('chai-as-promised'));

type Input = (collection: FirestoreCollectionV3<DBProto_Type_MultiKey>) => Promise<any>

type Test = TestSuite<Input, PreDB<DB_Type_MultiKey>[]>; //result - the items left in the collection after deletion

const dbDef: DBDef_V3<DBProto_Type_MultiKey> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	dbKey: 'firestore-multiKeys',
	uniqueKeys: ['aKey', 'bKey'],
	versions: ['1.0.0'],
	entityName: 'multikeys-test',
	frontend: {
		group: 'test',
		name: 'firestore-multiKeys'
	},
	backend: {
		name: 'firestore-multiKeys',
	},
};

const sampleDoc1 = Object.freeze({aKey: 'aaaa', bKey: 9, content: 'content1'});
const compareId = (origin: PreDB<DB_Type_MultiKey>, target: DB_Type_MultiKey) => {
	expect(composeDbObjectUniqueId(origin, dbDef.uniqueKeys!)).to.eql(target._id);
};

export const TestCases_FB_MultiKeys: Test['testcases'] = [
	{
		description: 'create one item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV3<DBProto_Type_MultiKey>) => {
			const dbItem = await collection.create.item(deepClone(sampleDoc1));
			compareId(sampleDoc1, dbItem);
			validateDBObject(dbItem);
		}
	},
	{
		description: 'create duplicate item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV3<DBProto_Type_MultiKey>) => {
			const toOverrideWith = {...sampleDoc1, content: 'content2'};
			await collection.create.item(deepClone(sampleDoc1));
			await expect(collection.create.item(deepClone(toOverrideWith))).to.be.rejectedWith(Error);
		}
	},
	{
		description: 'set one item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV3<DBProto_Type_MultiKey>) => {
			const dbItem = await collection.set.item(deepClone(sampleDoc1));
			compareId(sampleDoc1, dbItem);
		}
	},
	{
		description: 'set and re-set an item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV3<DBProto_Type_MultiKey>) => {
			const toOverrideWith = {...sampleDoc1, content: 'content2'};

			const dbItem1 = await collection.create.item(deepClone(sampleDoc1));
			const dbItem2 = await collection.set.item(deepClone(toOverrideWith));
			compareId(dbItem1, dbItem2);
		}
	},
	{
		description: 'create same two items',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV3<DBProto_Type_MultiKey>) => {
			const item1 = deepClone(sampleDoc1);
			const item2 = {...sampleDoc1, content: 'content2'};
			await expect(collection.create.all([item1, item2])).to.be.rejectedWith(Error);
		}
	},
	{
		description: 'set same two items',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollectionV3<DBProto_Type_MultiKey>) => {
			const item1 = deepClone(sampleDoc1);
			const item2 = {...sampleDoc1, content: 'content2'};
			await collection.create.item(deepClone(sampleDoc1));
			await expect(collection.set.all([item1, item2])).to.be.rejectedWith(Error);
		}
	},
];

export const TestSuite_FirestoreV3_MultiKeys: Test = {
	label: 'Firestore Multi-Keys',
	testcases: TestCases_FB_MultiKeys,
	processor: async (testCase) => {
		const collection = firestore.getCollection(dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		await testCase.input(collection);
	}
};

