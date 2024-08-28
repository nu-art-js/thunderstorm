import {duplicateObjectToCreate, firestore, testInstance2} from '../_core/consts';
import {asArray, deepClone} from '@thunder-storm/common';
import {CreateTest, createTestCases} from './consts';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {createTests_dbDef} from './create';
import {DBProto_Type} from '../../_entity/type/shared';

const chai = require('chai');
chai.use(chaiAsPromised);

export const TestCases_FB_CreateAll: CreateTest['testcases'] = [
	...createTestCases,
	{
		description: 'create.all with one object that already exists',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				// create twice and expect to reject
				expect(collection.create.all([toCreate])).to.eventually.be.rejected.and.have.property('code', 6); // Firestore exception code 6 is 'Already Exists'
			}
		}
	},
	{
		description: 'create.all with two objects, one already exists',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone([duplicateObjectToCreate, testInstance2]);
				// create twice and expect to reject
				await expect(collection.create.all(toCreate)).to.be.rejectedWith(Error);
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

				const promise = collection.runTransaction(async (transaction) => {
					return collection.create.all([toCreate], transaction);
				});
				await expect(promise).to.be.rejectedWith();
			}

		}
	},
	{
		description: '1 with transaction',
		result: [],
		input: {
			value: [],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);

				await collection.runTransaction(async (transaction) => await expect(collection.create.all([toCreate], transaction)).to.be.fulfilled);
			}
		}
	},
	{
		description: '2 items 1 _id',
		result: [],
		input: {
			value: [],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				const toCreate2 = deepClone(duplicateObjectToCreate);

				await expect(collection.create.all([toCreate, toCreate2])).to.be.rejectedWith;
			}
		}
	}
];

export const TestSuite_FirestoreV3_CreateAll: CreateTest = {
	label: 'Firestore createAll tests',
	testcases: TestCases_FB_CreateAll,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DBProto_Type>(createTests_dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		const toCreate = deepClone(testCase.input.value);

		await collection.create.all(asArray(toCreate));

		await testCase.input.check!(collection, testCase.result);
	}
};