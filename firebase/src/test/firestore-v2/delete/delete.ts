import {expect} from 'chai';
import {firestore, testInstance1, testInstance2, testInstance3} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {deepClone, PreDB} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';


type Input = {
	toInsert: PreDB<DB_Type>[];
	check: (collection: FirestoreCollectionV2<DB_Type>, expectedItem?: PreDB<DB_Type>[]) => Promise<void>
}

type Test = TestSuite<Input, PreDB<DB_Type>[] | undefined>;

export const TestCases_FB_DeleteAll: Test['testcases'] = [
	{
		description: 'Insert & Delete all',
		result: [],
		input: {
			toInsert: [testInstance1, testInstance2, testInstance3],
			check: async (collection, expectedResult) => {
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(0);
			}
		}
	},
];

export const TestSuite_FirestoreV2_Delete: Test = {
	label: 'Firestore deletion tests',
	testcases: TestCases_FB_DeleteAll,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-deletion-tests');
		await collection.deleteCollection();
		const toInsert = deepClone(testCase.input.toInsert);
		await collection.insertAll(toInsert);
		await collection.delete.allItems(toInsert);
		await testCase.input.check(collection, testCase.result);
	}
};
