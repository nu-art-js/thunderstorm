import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {deepClone, ValidationException} from '@nu-art/ts-common';
import {InsertTest, insertTestCases} from './consts-insert';
import {expect} from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

const chai = require('chai');
chai.use(chaiAsPromised);

export const TestCases_FB_InsertAll: InsertTest['testcases'] = [
	...insertTestCases,
];

export const TestSuit_FirestoreV2_InsertAll: InsertTest = {
	label: 'Firestore insertAll tests',
	testcases: TestCases_FB_InsertAll,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-insertion-tests');
		await collection.deleteCollection();

		const toInsert = deepClone(testCase.input.value);

		if (testCase.input.expectInsertToThrow) {
			await expect(collection.insert.all(Array.isArray(toInsert) ? toInsert : [toInsert])).to.be.rejectedWith(ValidationException);
			return;
		}


		await collection.insert.all(Array.isArray(toInsert) ? toInsert : [toInsert]);

		await testCase.input.check!(collection, testCase.result);
	}
};