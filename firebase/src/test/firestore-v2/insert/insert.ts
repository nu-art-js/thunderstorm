import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {deepClone, PreDB, ValidationException} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {expect} from 'chai';
import {TestModel} from '@nu-art/ts-common/testing/types';
import * as chaiAsPromised from 'chai-as-promised';
import {CreateTest, createTestCases, InsertTestInput, TestInputValue} from './consts';

const chai = require('chai');
chai.use(chaiAsPromised);

export const TestCases_FB_Insert: CreateTest['testcases'] = [
	...createTestCases,
];

export const TestSuite_FirestoreV2_Insert: CreateTest = {
	label: 'Firestore insert tests',
	testcases: TestCases_FB_Insert,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-insertion-tests');
		await collection.deleteCollection();

		if (testCase.input.expectCreateToThrow) {
			await expect(insertImpl(testCase, collection)).to.be.rejectedWith(ValidationException);
			return;
		}

		await insertImpl(testCase, collection);

		await testCase.input.check!(collection, testCase.result);
	}
};

async function insertImpl(testCase: TestModel<InsertTestInput, TestInputValue>, collection: FirestoreCollectionV2<DB_Type>) {
	const toInsert = deepClone(testCase.input.value);
	if (Array.isArray(toInsert))
		await insertMultiple(toInsert, collection);
	else
		await collection.create.item(toInsert);
}

async function insertMultiple(toInsert: PreDB<DB_Type>[], collection: FirestoreCollectionV2<DB_Type>) {
	await Promise.all(toInsert.map(collection.create.item));
}