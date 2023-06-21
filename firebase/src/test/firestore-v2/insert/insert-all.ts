import {firestore, testInstance1} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {deepClone} from '@nu-art/ts-common';
import {CreateTest, createTestCases} from './consts';
import * as chaiAsPromised from 'chai-as-promised';

const chai = require('chai');
chai.use(chaiAsPromised);

export const TestCases_FB_CreateAll: CreateTest['testcases'] = [
	...createTestCases,
	{
		description: 'object exists',
		result: [],
		input: {
			value: [{...testInstance1, _id: 'zevel'}],
			check: async (collection, expectedResult) => {
				// @ts-ignore
				const a = "";
				// const toCreate = deepClone({...testInstance1, _id: 'zevel'});
				// // insert twice and expect to reject
				// await expect(collection.create.all(Array.isArray(toCreate) ? toCreate : [toCreate])).to.be.rejectedWith(FirestoreException);
			}
		}

	}
];

export const TestSuite_FirestoreV2_CreateAll: CreateTest = {
	label: 'Firestore createAll tests',
	testcases: TestCases_FB_CreateAll,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-creation-tests');
		await collection.deleteCollection();

		const toCreate = deepClone(testCase.input.value);

		await collection.create.all(Array.isArray(toCreate) ? toCreate : [toCreate]);

		await testCase.input.check!(collection, testCase.result);
	}
};