import {runSingleTestCase} from '@nu-art/testalot';
import {test_FirestoreV3_Create} from './create.js';
import {test_FirestoreV3_CreateAll} from './create-all.js';
import {createTestCases} from './consts.js';
import {duplicateObjectToCreate, testInstance2} from '../_core/consts.js';
import {deepClone} from '@nu-art/ts-common';
import {expect} from 'chai';
import {CreateTestInput} from './consts.js';
import {FirestoreTransaction} from '../../../main/index.js';

const runTestCase_Create = (testCase: { description?: string; input: CreateTestInput; result: any }) => () => runSingleTestCase(test_FirestoreV3_Create, testCase);
const runTestCase_CreateAll = (testCase: { description?: string; input: CreateTestInput; result: any }) => () => runSingleTestCase(test_FirestoreV3_CreateAll, testCase);

describe('Firestore v3 - Create', () => {
	it('1 item', runTestCase_Create(createTestCases[0]));

	it('2 items', runTestCase_Create(createTestCases[1]));

	it('5 items', runTestCase_Create(createTestCases[2]));

	it(`${createTestCases[3].description}`, runTestCase_Create(createTestCases[3]));

	it('2 identical items', runTestCase_Create(createTestCases[4]));

	it('object exists', runTestCase_Create({
		description: 'object exists',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				await expect(collection.create.item(toCreate)).to.be.rejectedWith();
			}
		}
	}));

	it('object exists with transaction', runTestCase_Create({
		description: 'object exists with transaction',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				const promise = collection.runTransaction(async (transaction: FirestoreTransaction) => {
					return collection.create.item(toCreate, transaction);
				});
				await expect(promise).to.be.rejectedWith();
			}
		}
	}));

	it('create 1 with transaction', runTestCase_Create({
		description: 'create 1 with transaction',
		result: [],
		input: {
			value: [],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				await collection.runTransaction(async (transaction: FirestoreTransaction) => await expect(collection.create.item(toCreate, transaction)).to.be.fulfilled);
			}
		}
	}));
});

describe('Firestore v3 - CreateAll', () => {
	it('1 item', runTestCase_CreateAll(createTestCases[0]));

	it('2 items', runTestCase_CreateAll(createTestCases[1]));

	it('5 items', runTestCase_CreateAll(createTestCases[2]));

	it(`${createTestCases[3].description}`, runTestCase_CreateAll(createTestCases[3]));

	it('2 identical items', runTestCase_CreateAll(createTestCases[4]));

	it('create.all with one object that already exists', runTestCase_CreateAll({
		description: 'create.all with one object that already exists',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				expect(collection.create.all([toCreate])).to.eventually.be.rejected.and.have.property('code', 6);
			}
		}
	}));

	it('create.all with two objects, one already exists', runTestCase_CreateAll({
		description: 'create.all with two objects, one already exists',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone([duplicateObjectToCreate, testInstance2]);
				await expect(collection.create.all(toCreate)).to.be.rejectedWith(Error);
			}
		}
	}));

	it('object exists with transaction', runTestCase_CreateAll({
		description: 'object exists with transaction',
		result: [],
		input: {
			value: [duplicateObjectToCreate],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				const promise = collection.runTransaction(async (transaction: FirestoreTransaction) => {
					return collection.create.all([toCreate], transaction);
				});
				await expect(promise).to.be.rejectedWith();
			}
		}
	}));

	it('1 with transaction', runTestCase_CreateAll({
		description: '1 with transaction',
		result: [],
		input: {
			value: [],
			check: async (collection, expectedResult) => {
				const toCreate = deepClone(duplicateObjectToCreate);
				await collection.runTransaction(async (transaction: FirestoreTransaction) => await expect(collection.create.all([toCreate], transaction)).to.be.fulfilled);
			}
		}
	}));

	it('2 items 1 _id', runTestCase_CreateAll({
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
	}));
});
