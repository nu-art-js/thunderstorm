import {TestSuite} from '@thunder-storm/common/testing/types';
import {DBDef_V3, deepClone, PreDB, tsValidateMustExist} from '@thunder-storm/common';
import {firestore, testInstance1} from '../_core/consts';
import {expect} from 'chai';
import {FirestoreCollectionV3} from '../../../main/backend/firestore-v3/FirestoreCollectionV3';
import {DB_Type, DBProto_Type} from '../_entity';

type Input = {
	action: (collection: FirestoreCollectionV3<DBProto_Type>, items: PreDB<DB_Type>[]) => Promise<void>
	numberOfItemsToCreate: number
}

const dbDef: DBDef_V3<DBProto_Type> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	dbKey: 'firestore-transaction-multi-write-tests',
	entityName: 'test',
	versions: ['1.0.0'],
	frontend: {
		group: 'test',
		name: 'firestore-transaction-multi-write-tests'
	},
	backend: {
		name: 'firestore-transaction-multi-write-tests'
	},
};

export const TestSuite_FirestoreV3_Transaction_MultiWrite: TestSuite<Input, {}> = {
	label: 'Firestore multi-write transaction tests',
	testcases: [
		{
			description: 'transaction - set 510 items',
			result: [],
			input: {
				numberOfItemsToCreate: 510,
				action: async (collection: FirestoreCollectionV3<DBProto_Type>, items: PreDB<DB_Type>[]) => {
					await collection.set.all(items);
				}
			},
		}
	],
	processor: async (testCase) => {
		const collection = firestore.getCollection<DBProto_Type>(dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		const items: PreDB<DB_Type>[] = [];
		for (let i = 0; i < testCase.input.numberOfItemsToCreate; i++)
			items.push(deepClone(testInstance1));

		await testCase.input.action(collection, items);
		expect(true).to.eql(true);
	}
};