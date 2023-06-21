import * as chai from 'chai';
import {expect} from 'chai';
import {firestore} from '../_core/consts';
import {DB_Type} from '../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {compare, deepClone, PreDB, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';

chai.use(require('chai-as-promised'));


type Input = {
	setAction: (collection: FirestoreCollectionV2<DB_Type>, inserted: DB_Type[]) => Promise<void>
	toCreate: PreDB<DB_Type>[]
}

type Test = TestSuite<Input, () => PreDB<DB_Type>[]>; //result - the items left in the collection after deletion

export const TestCases_FB_Set: Test['testcases'] = [
	// {
	// 	description: 'set new item',
	// 	result: () => {
	// 		return [deepClone(testInstance1)];
	// 	},
	// 	input: {
	// 		toInsert: [],
	// 		setAction: async (collection, inserted) => {
	// 			await collection.set.item(deepClone(testInstance1));
	// 		}
	// 	}
	// },
	// {
	// 	description: 'set existing item',
	// 	result: () => {
	// 		const _instance = deepClone(testInstance1);
	// 		_instance.stringValue = updatedStringValue;
	// 		return [_instance];
	// 	},
	// 	input: {
	// 		toInsert: [testInstance1],
	// 		setAction: async (collection, inserted) => {
	// 			inserted[0].stringValue = updatedStringValue;
	// 			await collection.set.item(inserted[0]);
	// 		}
	// 	}
	// },
];

export const TestSuite_FirestoreV2_Set: Test = {
	label: 'Firestore set tests',
	testcases: TestCases_FB_Set,
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-deletion-tests');
		await collection.deleteCollection();

		const toInsert = deepClone(testCase.input.toCreate);
		const inserted = await collection.create.all(Array.isArray(toInsert) ? toInsert : [toInsert]);

		await testCase.input.setAction(collection, inserted);
		const remainingDBItems = await collection.query.custom({where: {}});
		expect(true).to.eql(compare(sortArray(remainingDBItems.map(removeDBObjectKeys), item => item.stringValue), sortArray(testCase.result(), item => item.stringValue)));
	}
};
