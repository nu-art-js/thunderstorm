import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {deepClone, ValidationException} from '@nu-art/ts-common';
import {CreateTest, createTestCases} from './consts';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

const chai = require('chai');
chai.use(chaiAsPromised);

export const TestCases_FB_CreateAll: CreateTest['testcases'] = [
	...createTestCases,
];

export const TestSuite_FirestoreV2_CreateAll: CreateTest = {
	label: 'Firestore createAll tests',
	testcases: TestCases_FB_CreateAll,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-creation-tests');
		await collection.deleteCollection();

		const toCreate = deepClone(testCase.input.value);

		if (testCase.input.expectCreateToThrow) {
			await expect(collection.create.all(Array.isArray(toCreate) ? toCreate : [toCreate])).to.be.rejectedWith(ValidationException);
			return;
		}


		await collection.create.all(Array.isArray(toCreate) ? toCreate : [toCreate]);

		await testCase.input.check!(collection, testCase.result);
	}
};