import {firestore, testInstance1} from '../_core/consts';
import {DB_Type, TestInputValue} from '../_core/types';
import {DBDef, deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import * as chaiAsPromised from 'chai-as-promised';
import {CreateTest, createTestCases} from './consts';
import {expect} from 'chai';

const chai = require('chai');
chai.use(chaiAsPromised);

export const createTests_dbDef: DBDef<DB_Type> = {
	dbName: 'firestore-create-tests',
	entityName: 'create-test',
	validator: tsValidateMustExist
};
export const duplicateObjectToCreate = {...testInstance1, _id: testInstance1._uniqueId};
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

				await collection.runTransaction(async (transaction) => {
					await expect(collection.create.item(toCreate,transaction)).to.be.rejectedWith();
				});
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

				await collection.runTransaction(async (transaction) => await expect(collection.create.item(toCreate, transaction)).to.be.fulfilled);

			}
		}
	}
];


export const TestSuite_FirestoreV2_Create: CreateTest = {
	label: 'Firestore create tests',
	testcases: TestCases_FB_Create,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(createTests_dbDef);
		await collection.deleteCollection();

		const toCreate = deepClone(testCase.input.value);

		await createImpl(toCreate, collection);

		await testCase.input.check!(collection, testCase.result);
	}
};

async function createImpl(toCreate: TestInputValue, collection: FirestoreCollectionV2<DB_Type>) {
	if (Array.isArray(toCreate))
		await createMultiple(toCreate, collection);
	else
		await collection.create.item(toCreate);
}

async function createMultiple(toCreate: PreDB<DB_Type>[], collection: FirestoreCollectionV2<DB_Type>) {
	await Promise.all(toCreate.map(item => collection.create.item(item)));
}