import {expect} from 'chai';
import {firestore, testInstance1, testInstance2} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, PreDB} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';


type Input = {
	value: PreDB<DB_Type> | PreDB<DB_Type>[];
	check: (collection: FirestoreCollectionV2<DB_Type>, expectedItem?: PreDB<DB_Type>[]) => Promise<void>
}

type Test = TestSuite<Input, PreDB<DB_Type>[]>;

export const TestCases_FB_InsertAll: Test['testcases'] = [
	{
		description: 'InsertAll - one item',
		result: [testInstance1],
		input: {
			value: [testInstance1],
			check: async (collection, expectedResult) => {
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(1);
				expect(true).to.eql(compare([testInstance1], expectedResult));
			}
		}
	},
	{
		description: 'InsertAll - two items',
		result: [testInstance1, testInstance2],
		input: {
			value: [testInstance1, testInstance2],
			check: async (collection, expectedResult) => {
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(2);
				expect(true).to.eql(compare([testInstance1, testInstance2], expectedResult));
			}
		}
	}
];

export const TestSuit_FirestoreV2_InsertAll: Test = {
	label: 'Firestore insertion tests',
	testcases: TestCases_FB_InsertAll,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-insertion-tests');
		await collection.deleteAll();

		await collection.insertAll(Array.isArray(testCase.input.value) ? testCase.input.value : [testCase.input.value]);
		await testCase.input.check(collection, testCase.result);
	}
};
