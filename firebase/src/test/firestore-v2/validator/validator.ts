import * as chai from 'chai';
import {expect} from 'chai';
import {CollectionTest, prepareCollectionTest} from '../_core/consts';
import {DB_Type_Complex} from '../_core/types';

chai.use(require('chai-as-promised'));

export const TestCases_FB_Validator: CollectionTest['testcases'] = [
	{
		description: 'validator create pass',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.create.item({refs: [], name: 'a'})).to.be.fulfilled;
			}
		}
	},
	{
		description: 'validator create fail',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.create.item({} as DB_Type_Complex)).to.be.rejectedWith();
			}
		}
	},
	{
		description: 'validator upsert pass',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.upsert.item({refs: [], name: 'a'})).to.be.fulfilled;
			}
		}
	},
	{
		description: 'validator upsert fail',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.upsert.item({} as DB_Type_Complex)).to.be.rejectedWith();
			}
		}
	},
	{
		description: 'validator upsert pass',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.upsert.item({refs: [], name: 'a'})).to.be.fulfilled;
			}
		}
	},
	{
		description: 'validator upsert fail',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.upsert.item({} as DB_Type_Complex)).to.be.rejectedWith();
			}
		}
	},
];

export const TestSuite_FirestoreV2_Validator: CollectionTest = {
	label: 'Firestore validator tests',
	testcases: TestCases_FB_Validator,
	processor: async (testCase) => {
		await prepareCollectionTest(testCase);
	}
};