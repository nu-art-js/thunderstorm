import {expect} from 'chai';
import {firestore, testInstance1, testInstance2} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, deepClone, PreDB, removeDBObjectKeys} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {testInstance3, testInstance4, testInstance5} from '../../firestore/_core/consts';
import {FB_Type} from '../../firestore/_core/types';


type Input = {
	value: PreDB<DB_Type> | PreDB<DB_Type>[];
	check: (collection: FirestoreCollectionV2<DB_Type>, expectedItem?: PreDB<DB_Type>[]) => Promise<void>
}

type Test = TestSuite<Input, PreDB<DB_Type>[] | undefined>;

export const TestCases_FB_InsertAll: Test['testcases'] = [
	{
		description: 'InsertAll - one it1111em',
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
	},
	{
		description: 'InsertAll - five items',
		result: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
		input: {
			value: [testInstance1, testInstance2, testInstance3, testInstance4, testInstance5],
			check: async (collection, expectedResult) => {
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(5);
				expect(true).to.eql(compare([testInstance1, testInstance2, testInstance3, testInstance4, testInstance5], expectedResult));
			}
		}
	},
	{
		description: 'Insert & Query - two same items',
		result: [testInstance1, testInstance1],
		input: {
			value: [testInstance1, testInstance1],
			check: async (collection, expectedResult) => {
				const items = await collection.queryInstances({where: {}});

				expect(items.length).to.eql(2);

				const dbItems=items.map(removeDBObjectKeys)
				expect(true).to.eql(compare(dbItems, expectedResult as FB_Type[]));
			}
		}
	}
];

export const TestSuit_FirestoreV2_InsertAll: Test = {
	label: 'Firestore insertion tests',
	testcases: TestCases_FB_InsertAll,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-insertion-tests');
		await collection.deleteCollection();
		const toInsert = deepClone(testCase.input.value);
		await collection.insertAll(Array.isArray(toInsert) ? toInsert : [toInsert]);
		await testCase.input.check(collection, testCase.result);
	}
};
