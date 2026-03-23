import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {firestore, validateDBObject} from '../../_entity/_core/consts.js';
import {Database} from '@nu-art/db-api-shared';
import {deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {_EmptyQuery, composeDbObjectUniqueId} from '@nu-art/firebase-shared';
import {DB_Type_MultiKey, DatabaseDef_Type_MultiKey} from '../../_entity/type-multi-key/index.js';
import {FirestoreCollection} from '../../../main/firestore/FirestoreCollection.js';

chai.use(chaiAsPromised);

type Input = (collection: FirestoreCollection<DatabaseDef_Type_MultiKey>) => Promise<any>;

type TestCase_MultiKeys = {
	description?: string | ((tc: TestCase_MultiKeys) => string);
	input: Input;
	result: PreDB<DB_Type_MultiKey>[];
};

type Test = {
	label: string;
	testcases: TestCase_MultiKeys[];
	processor: (testCase: TestCase_MultiKeys) => Promise<void>;
};

const dbDef: Database<DatabaseDef_Type_MultiKey> = {
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

export const TestCases_FB_MultiKeys: TestCase_MultiKeys[] = [
	{
		description: 'create one item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollection<DatabaseDef_Type_MultiKey>) => {
			const dbItem = await collection.create.item(deepClone(sampleDoc1));
			compareId(sampleDoc1, dbItem);
			validateDBObject(dbItem);
		}
	},
	{
		description: 'create duplicate item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollection<DatabaseDef_Type_MultiKey>) => {
			const toOverrideWith = {...sampleDoc1, content: 'content2'};
			await collection.create.item(deepClone(sampleDoc1));
			await expect(collection.create.item(deepClone(toOverrideWith))).to.be.rejectedWith(Error);
		}
	},
	{
		description: 'set one item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollection<DatabaseDef_Type_MultiKey>) => {
			const dbItem = await collection.set.item(deepClone(sampleDoc1));
			compareId(sampleDoc1, dbItem);
		}
	},
	{
		description: 'set and re-set an item',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollection<DatabaseDef_Type_MultiKey>) => {
			const toOverrideWith = {...sampleDoc1, content: 'content2'};

			const dbItem1 = await collection.create.item(deepClone(sampleDoc1));
			const dbItem2 = await collection.set.item(deepClone(toOverrideWith));
			compareId(dbItem1, dbItem2);
		}
	},
	{
		description: 'create same two items',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollection<DatabaseDef_Type_MultiKey>) => {
			const item1 = deepClone(sampleDoc1);
			const item2 = {...sampleDoc1, content: 'content2'};
			await expect(collection.create.all([item1, item2])).to.be.rejectedWith(Error);
		}
	},
	{
		description: 'set same two items',
		result: [sampleDoc1],
		input: async (collection: FirestoreCollection<DatabaseDef_Type_MultiKey>) => {
			const item1 = deepClone(sampleDoc1);
			const item2 = {...sampleDoc1, content: 'content2'};
			await collection.create.item(deepClone(sampleDoc1));
			await expect(collection.set.all([item1, item2])).to.be.rejectedWith(Error);
		}
	},
];

export const TestCases_FirestoreV3_MultiKeys = TestCases_FB_MultiKeys;

export const test_FirestoreV3_MultiKeys = async (input: Input): Promise<PreDB<DB_Type_MultiKey>[]> => {
	const collection = firestore.getCollection(dbDef);
	await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	await input(collection);
	return collection.query.custom(_EmptyQuery).then(items => items.map(i => ({...i, _id: i._id} as PreDB<DB_Type_MultiKey>)));
};

export const TestSuite_FirestoreV3_MultiKeys: Test = {
	label: 'Firestore Multi-Keys',
	testcases: TestCases_FB_MultiKeys,
	processor: async (testCase: TestCase_MultiKeys) => {
		const collection = firestore.getCollection(dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await testCase.input(collection);
	}
};

