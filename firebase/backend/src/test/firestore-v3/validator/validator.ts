import {CollectionTest, CollectionTestInput, prepareCollectionTest} from '../../_entity/_core/consts.js';
import {DB_Type_Complex, TestInputValue} from '../_entity.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';

chai.use(chaiAsPromised);

export const TestCases_FB_Validator: CollectionTest['testcases'] = [
	{
		description: 'validator create.item pass',
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
		description: 'validator create.item fail',
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
		description: 'validator create.all pass',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.create.all([{refs: [], name: 'a'}])).to.be.fulfilled;
			}
		}
	},
	{
		description: 'validator create.all fail',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.create.all([{} as DB_Type_Complex])).to.be.rejectedWith();
			}
		}
	},
	// {
	// 	description: 'validator upsert.item pass',
	// 	result: [],
	// 	input: {
	// 		outerCollection: [],
	// 		innerCollection: [],
	// 		check: async (collectionOuter, collectionInner) => {
	// 			await expect(collectionOuter.upsert.item({refs: [], name: 'a'})).to.be.fulfilled;
	// 		}
	// 	}
	// },
	// {
	// 	description: 'validator upsert.item fail',
	// 	result: [],
	// 	input: {
	// 		outerCollection: [],
	// 		innerCollection: [],
	// 		check: async (collectionOuter, collectionInner) => {
	// 			await expect(collectionOuter.upsert.item({} as DB_Type_Complex)).to.be.rejectedWith();
	// 		}
	// 	}
	// },
	// {
	// 	description: 'validator upsert.all pass',
	// 	result: [],
	// 	input: {
	// 		outerCollection: [],
	// 		innerCollection: [],
	// 		check: async (collectionOuter, collectionInner) => {
	// 			await expect(collectionOuter.upsert.all([{refs: [], name: 'a'}])).to.be.fulfilled;
	// 		}
	// 	}
	// },
	// {
	// 	description: 'validator upsert.all fail',
	// 	result: [],
	// 	input: {
	// 		outerCollection: [],
	// 		innerCollection: [],
	// 		check: async (collectionOuter, collectionInner) => {
	// 			await expect(collectionOuter.upsert.all([{} as DB_Type_Complex])).to.be.rejectedWith();
	// 		}
	// 	}
	// },
	{
		description: 'validator set.item pass',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.set.item({refs: [], name: 'a'})).to.be.fulfilled;
			}
		}
	},
	{
		description: 'validator set.item fail',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.set.item({} as DB_Type_Complex)).to.be.rejectedWith();
			}
		}
	},
	{
		description: 'validator set.all pass',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.set.all([{refs: [], name: 'a'}])).to.be.fulfilled;
			}
		}
	},
	{
		description: 'validator set.all fail',
		result: [],
		input: {
			outerCollection: [],
			innerCollection: [],
			check: async (collectionOuter, collectionInner) => {
				await expect(collectionOuter.set.all([{} as DB_Type_Complex])).to.be.rejectedWith();
			}
		}
	},
];

export const TestCases_FirestoreV3_Validator = TestCases_FB_Validator;

export const test_FirestoreV3_Validator = async (input: CollectionTestInput): Promise<TestInputValue> => {
	await prepareCollectionTest({input, result: []});
	return [];
};

export const TestSuite_FirestoreV3_Validator: CollectionTest = {
	label: 'Firestore validator tests',
	testcases: TestCases_FB_Validator,
	processor: async (testCase: CollectionTest['testcases'][number]) => {
		await prepareCollectionTest(testCase);
	}
};