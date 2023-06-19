import {expect} from 'chai';
import {testInstance1, testInstance2} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, PreDB} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {firestore} from './__test';


type Input = {
	value: PreDB<DB_Type> | PreDB<DB_Type>[];
	check: (collection: FirestoreCollectionV2<DB_Type>, expectedItem?: PreDB<DB_Type>) => Promise<void>
}

type Test = TestSuite<Input, PreDB<DB_Type> | undefined>;

export const TestCases_FB_Insert: Test['testcases'] = [
	{
		description: 'Insert & Query - one item2',
		result: testInstance2,
		input: {
			value: testInstance1,
			check: async (collection, expectedItem) => {
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(1);
				expect(true).to.eql(compare(expectedItem, items[0]));
			}
		}
	},
];

export const TestSuit_FirestoreV2_Insert: Test = {
	label: 'Firestore insertion tests',
	testcases: TestCases_FB_Insert,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-insertion-tests');
		const ref = collection.getDocumentRef(testCase.input.value as PreDB<DB_Type>);
		await ref.set(testCase.input.value as PreDB<DB_Type>);

		await collection.test_DeleteAll();
		// await collection.insertAll(testCase.input.value);
		await testCase.input.check(collection, testCase.result);
	}
};
