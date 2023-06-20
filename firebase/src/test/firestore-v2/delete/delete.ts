import {expect} from 'chai';
import {firestore, testInstance1, testInstance2, testInstance3} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {deepClone, generateHex, PreDB} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';


type Input = {
	toInsert?: PreDB<DB_Type>[];
	check: (collection: FirestoreCollectionV2<DB_Type>, expectedItem?: PreDB<DB_Type>[]) => Promise<void>
}

type Test = TestSuite<Input, PreDB<DB_Type>[] | undefined>;

export const TestCases_FB_Delete: Test['testcases'] = [
	{
		description: 'insert & delete.unique 1',
		result: [],
		input: {
			check: async (collection, expectedResult) => {
				const _inserted = await collection.insert.item(deepClone(testInstance1));
				await collection.delete.unique(_inserted._id);
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(0);
			}
		}
	},
	{
		description: 'insert 1 & delete.unique random _id',
		result: [],
		input: {
			check: async (collection, expectedResult) => {
				await collection.insert.item(deepClone(testInstance1));
				await collection.delete.unique(generateHex(32));
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(1);
			}
		}
	},
	{
		description: 'insert 3 & delete.all',
		result: [],
		input: {
			check: async (collection, expectedResult) => {
				const _inserted = await collection.insert.all(deepClone([testInstance1, testInstance2, testInstance3]));
				await collection.delete.all(_inserted.map(_item => _item._id));
				const items = await collection.queryInstances({where: {}});
				expect(items.length).to.eql(0);
			}
		}
	},
];

export const TestSuite_FirestoreV2_Delete: Test = {
	label: 'Firestore delete tests',
	testcases: TestCases_FB_Delete,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-deletion-tests');
		await collection.deleteCollection();
		await testCase.input.check(collection, testCase.result);
	}
};
