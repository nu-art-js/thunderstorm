import {DBDef_V3, deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {firestore, testInstance1} from '../../_entity/_core/consts.js';
import {expect} from 'chai';
import {FirestoreCollectionV3} from '../../../main/firestore-v3/FirestoreCollectionV3.js';
import {DB_Type, DBProto_Type} from '../_entity.js';

type Input = {
	action: (collection: FirestoreCollectionV3<DBProto_Type>, items: PreDB<DB_Type>[]) => Promise<void>
	numberOfItemsToCreate: number
}

type MultiWriteTestCase = { description?: string; input: Input; result: {} };
type MultiWriteTestConfig = { label: string; testcases: MultiWriteTestCase[]; processor?: (testCase: MultiWriteTestCase) => Promise<void> };

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

const testcases_MultiWrite: MultiWriteTestCase[] = [
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
];

const processor_MultiWrite: MultiWriteTestConfig['processor'] = async (testCase: MultiWriteTestCase) => {
	const collection = firestore.getCollection<DBProto_Type>(dbDef);
	await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

	const items: PreDB<DB_Type>[] = [];
	for (let i = 0; i < testCase.input.numberOfItemsToCreate; i++)
		items.push(deepClone(testInstance1));

	await testCase.input.action(collection, items);
	expect(true).to.eql(true);
};

export const TestCases_FirestoreV3_Transaction_MultiWrite = testcases_MultiWrite;

export const test_FirestoreV3_Transaction_MultiWrite = async (input: Input): Promise<{}> => {
	await processor_MultiWrite({...testcases_MultiWrite[0], input});
	return {};
};

export const TestConfig_FirestoreV3_Transaction_MultiWrite: MultiWriteTestConfig = {
	label: 'Firestore multi-write transaction tests',
	testcases: testcases_MultiWrite,
	processor: processor_MultiWrite
};