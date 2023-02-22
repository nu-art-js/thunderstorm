import {FirestoreCollection, ModuleBE_Firebase} from '../../main/backend';
import {expect} from 'chai';
import {FB_Type} from './_core/types';
import {FirestoreQuery} from '../../main';
import {TestModel, TestSuite} from '@nu-art/ts-common/test-index';
import {
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5,
	testItem1,
	testNumber2,
	testNumber3,
	testString1,
	testString2,
	testString3,
	testString4
} from './_core/consts';

type Test = TestSuite<Input, FB_Type>;

type Input = {
	query: FirestoreQuery<FB_Type>;
}

const allTestItems = [
	testInstance1,
	testInstance2,
	testInstance3,
	testInstance4,
	testInstance5
];

const TestCases_FB_QueryUnique: Test['testcases'] = [
	{
		description: 'Unique Query - number',
		result: testInstance2,
		input: {
			query: {
				where: {numeric: testNumber2},
			}
		},
	},
	{
		description: 'Unique Query - string',
		result: testInstance3,
		input: {
			query: {
				where: {stringValue: testString3},
			}
		},
	},
	{
		description: 'Unique Query - boolean',
		result: testInstance4,
		input: {
			query: {
				where: {booleanValue: testInstance4.booleanValue},
			}
		},
	},
	{
		description: 'Unique Query - boolean & string',
		result: testInstance4,
		input: {
			query: {
				where: {booleanValue: testInstance4.booleanValue, stringValue: testString4},
			}
		},
	},
];

export const TestSuit_FB_QueryUnique: Test = {
	label: 'Firestore query unique tests',
	testcases: TestCases_FB_QueryUnique,
	preProcessor: async () => {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		const collection = firestore.getCollection('firestore-query-unique-tests');
		await collection.deleteAll();
		await collection.insertAll(allTestItems);
	},
	processor: async (testCase) => {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		const collection = firestore.getCollection('firestore-query-unique-tests');
		const item = await collection.queryUnique(testCase.input.query);
		expect(item).to.eql(testCase.result);
	},
};