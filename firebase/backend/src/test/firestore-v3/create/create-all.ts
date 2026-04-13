import {duplicateObjectToCreate, firestore, testInstance2} from '../../_entity/_core/consts.js';
import {asArray, deepClone} from '@nu-art/ts-common';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {createTestCases, CreateTestInput} from './consts.js';
import {expect} from 'chai';
import {createTests_dbDef} from './create.js';
import {DatabaseDef_Type} from '../../_entity/type/index.js';
import {TestInputValue} from '../_entity.js';
import {TestModel} from '@nu-art/testalot';

chai.use(chaiAsPromised);

export type TestCase_FirestoreV3_CreateAll = TestModel<CreateTestInput, TestInputValue>;

export const TestCases_FB_CreateAll: TestCase_FirestoreV3_CreateAll[] = [
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

				const promise = collection.runTransaction(async () => {
					return collection.create.all([toCreate]);
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

				await collection.runTransaction(async () => await expect(collection.create.all([toCreate])).to.be.fulfilled);
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

const test = async (input: CreateTestInput): Promise<TestInputValue> => {
	const collection = firestore.getCollection<DatabaseDef_Type>(createTests_dbDef);
	await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

	const toCreate = deepClone(input.value);

	await collection.create.all(asArray(toCreate));

	if (input.check)
		await input.check(collection, input.value);

	return input.value;
};

export const TestCases_FirestoreV3_CreateAll = TestCases_FB_CreateAll;
export const test_FirestoreV3_CreateAll = test;