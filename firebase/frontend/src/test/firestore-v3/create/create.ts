import {duplicateObjectToCreate, firestore} from '../_core/consts.js';
import {Database} from '@nu-art/db-api-shared';
import {deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import * as chaiAsPromised from 'chai-as-promised';
import {CreateTest, createTestCases} from './consts.js';
import {expect} from 'chai';
import {DB_Type, DatabaseDef_Type, TestInputValue} from '../_entity.js';
import {FirestoreCollection} from '../../../main/backend/firestore/FirestoreCollection.js';

const chai = await import('\'chai\'');
chai.use(chaiAsPromised);

export const createTests_dbDef: Database<DatabaseDef_Type> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	dbKey: 'firestore-create-tests',
	entityName: 'create-test',
	versions: ['1.0.0'],
	frontend: {
		group: 'test',
		name: 'firestore-create-tests'
	},
	backend: {
		name: 'firestore-create-tests',
	}
};

export const TestCases_FB_Create: CreateTest['testcases'] = [
	...createTestCases,
	{
		description: 'object exists',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				// create twice and expect to reject

				await expect(collection.create.item(toCreate)).to.be.rejectedWith();
			}
		}
	},
	{
		description: 'object exists with transaction',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				// create twice and expect to reject
				const promise = collection.runTransaction(async () => {
					return collection.create.item(toCreate);
				});
				await expect(promise).to.be.rejectedWith();
			}
		}
	},
	{
		description: 'create 1 with transaction',
		result: [],
		input: {
			value: [],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);

				await collection.runTransaction(async () => await expect(collection.create.item(toCreate)).to.be.fulfilled);

			}
		}
	}
];


export const TestSuite_FirestoreV3_Create: CreateTest = {
	label: 'Firestore create tests',
	testcases: TestCases_FB_Create,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DatabaseDef_Type>(createTests_dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		const toCreate = deepClone(testCase.input.value);

		await createImpl(toCreate, collection);

		await testCase.input.check!(collection, testCase.result);
	}
};

async function createImpl(toCreate: TestInputValue, collection: FirestoreCollection<DatabaseDef_Type>) {
	if (Array.isArray(toCreate))
		await createMultiple(toCreate, collection);
	else
		await collection.create.item(toCreate);
}

async function createMultiple(toCreate: PreDB<DB_Type>[], collection: FirestoreCollection<DatabaseDef_Type>) {
	await Promise.all(toCreate.map(item => collection.create.item(item)));
}