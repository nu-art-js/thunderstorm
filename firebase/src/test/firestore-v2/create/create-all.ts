import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {deepClone} from '@nu-art/ts-common';
import {CreateTest, createTestCases} from './consts';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {FirestoreException} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {createTests_dbDef, duplicateObjectToCreate} from './create';

const chai = require('chai');
chai.use(chaiAsPromised);

export const TestCases_FB_CreateAll: CreateTest['testcases'] = [
	...createTestCases,
	{
		description: 'object exists',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				// create twice and expect to reject
				await expect(collection.create.all([toCreate])).to.be.rejectedWith(FirestoreException);
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
					await expect(collection.create.all([toCreate])).to.be.rejectedWith();
				});
			}

		}
	},
	{
		description: 'with transaction',
		result: [],
		input: {
			value: [],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				// create twice and expect to reject

				await collection.runTransaction(async (transaction) => await expect(collection.create.all([toCreate], transaction)).to.be.fulfilled);
			}
		}
	}
];

export const TestSuite_FirestoreV2_CreateAll: CreateTest = {
	label: 'Firestore createAll tests',
	testcases: TestCases_FB_CreateAll,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(createTests_dbDef);
		await collection.deleteCollection();

		const toCreate = deepClone(testCase.input.value);

		await collection.create.all(Array.isArray(toCreate) ? toCreate : [toCreate]);

		await testCase.input.check!(collection, testCase.result);
	}
};