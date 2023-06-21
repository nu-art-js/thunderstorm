import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {deepClone, PreDB, ValidationException} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {expect} from 'chai';
import {TestModel} from '@nu-art/ts-common/testing/types';
import * as chaiAsPromised from 'chai-as-promised';
import {CreateTest, createTestCases, CreateTestInput, TestInputValue} from './consts';

const chai = require('chai');
chai.use(chaiAsPromised);

export const TestCases_FB_Create: CreateTest['testcases'] = [
	...createTestCases,
];

export const TestSuite_FirestoreV2_Create: CreateTest = {
	label: 'Firestore create tests',
	testcases: TestCases_FB_Create,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-creation-tests');
		await collection.deleteCollection();

		if (testCase.input.expectCreateToThrow) {
			await expect(createImpl(testCase, collection)).to.be.rejectedWith(ValidationException);
			return;
		}

		await createImpl(testCase, collection);

		await testCase.input.check!(collection, testCase.result);
	}
};

async function createImpl(testCase: TestModel<CreateTestInput, TestInputValue>, collection: FirestoreCollectionV2<DB_Type>) {
	const toCreate = deepClone(testCase.input.value);
	if (Array.isArray(toCreate))
		await createMultiple(toCreate, collection);
	else
		await collection.create.item(toCreate);
}

async function createMultiple(toCreate: PreDB<DB_Type>[], collection: FirestoreCollectionV2<DB_Type>) {
	await Promise.all(toCreate.map(collection.create.item));
}