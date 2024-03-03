import {TestSuite} from '@nu-art/ts-common/testing/types';
import {DB_Type} from '../_core/types';
import {DBDef, deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {firestore, testInstance1} from '../_core/consts';
import {expect} from 'chai';

type Input = {
	action: (collection: FirestoreCollectionV2<DB_Type>, items: PreDB<DB_Type>[]) => Promise<void>
	numberOfItemsToCreate: number
}

const dbDef: DBDef<DB_Type> = {
	dbKey: 'firestore-transaction-multi-write-tests',
	entityName: 'test',
	validator: tsValidateMustExist
};

export const TestSuite_FirestoreV2_Transaction_MultiWrite: TestSuite<Input, {}> = {
	label: 'Firestore multi-write transaction tests',
	testcases: [
		{
			description: 'transaction - set 510 items',
			result: [],
			input: {
				numberOfItemsToCreate: 510,
				action: async (collection: FirestoreCollectionV2<DB_Type>, items: PreDB<DB_Type>[]) => {
					await collection.set.all(items);
				}
			},
		}
	],
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		const items: PreDB<DB_Type>[] = [];
		for (let i = 0; i < testCase.input.numberOfItemsToCreate; i++)
			items.push(deepClone(testInstance1));

		await testCase.input.action(collection, items);
		expect(true).to.eql(true);
	}
};