import {expect} from 'chai';
import {firestore, testInstance1} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, deepClone, PreDB, removeDBObjectKeys} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';


type Input = {
	value: PreDB<DB_Type>;
	check: (collection: FirestoreCollectionV2<DB_Type>, expectedItem?: PreDB<DB_Type>) => Promise<void>
}

type Test = TestSuite<Input, PreDB<DB_Type> | undefined>;

export const TestCases_FB_Insert: Test['testcases'] = [
	{
		description: 'Insert & Query - one item',
		result: testInstance1,
		input: {
			value: testInstance1,
			check: async (collection, expectedResult) => {
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(1);
				expect(true).to.eql(compare(removeDBObjectKeys(items[0]), expectedResult as DB_Type));
			}
		}
	},
];

export const TestSuit_FirestoreV2_Insert: Test = {
	label: 'Firestore insertion tests',
	testcases: TestCases_FB_Insert,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-insertion-tests');
		await collection.deleteCollection();
		// const ref = collection.getDocumentRef(testCase.input.value as PreDB<DB_Type>);
		// await ref.set(testCase.input.value as PreDB<DB_Type>);
		const toInsert = deepClone(testCase.input.value);

		await collection.insert(toInsert);

		await testCase.input.check(collection, testCase.result);
	}
};
