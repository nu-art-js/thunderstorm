import {firestore, testInstance1} from '../../../_entity/_core/consts.js';
import {DBDef_V3, deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {expect} from 'chai';
import {DB_Type, DBProto_Type} from '../../_entity.js';

type TestCase_WriteMulti = { description?: string; input: {}; result: {} };
type Test_WriteMulti = { label: string; testcases: TestCase_WriteMulti[]; processor: (testCase: TestCase_WriteMulti) => Promise<void> };

const dbDef: DBDef_V3<DBProto_Type> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	dbKey: 'firestore-create-performance-tests',
	entityName: 'create-performance-test',
	versions: ['1.0.0'],
	frontend: {
		group: 'test',
		name: 'firestore-create-performance-tests'
	},
	backend: {
		name: 'firestore-create-performance-tests'
	},
};

const testCases_WriteMulti: TestCase_WriteMulti[] = [
	{description: 'performance - set.all', result: [], input: {}}
];

const processor_WriteMulti = async (_testCase: TestCase_WriteMulti): Promise<void> => {
	const collection = firestore.getCollection<DBProto_Type>(dbDef);
	await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

	const docNumber = 50000;

	console.log(`Initiating ${docNumber} items for performance test...`);
	const toCreate: PreDB<DB_Type>[] = [];
	for (let i = 0; i < docNumber; i++)
		toCreate.push(deepClone(testInstance1));

	console.log('Starting bulk set');
	let t0 = performance.now();
	await collection.create.all(toCreate, undefined, 'bulk');
	let t1 = performance.now();
	let allDocs = await collection.collection.listDocuments();
	console.log(`Created ${docNumber} items - time: ${(t1 - t0)} ms`);
	expect(allDocs.length).to.eql(docNumber);

	console.log('Deleting collection...');
	await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

	console.log('Starting batch set');
	t0 = performance.now();
	await collection.set.all(toCreate, undefined);
	t1 = performance.now();
	allDocs = await collection.collection.listDocuments();
	console.log(`Created ${docNumber} items - time: ${(t1 - t0)} ms`);
	expect(allDocs.length).to.eql(docNumber);
};

export const TestCases_FirestoreV2_Performance_WriteMulti = testCases_WriteMulti;

export const test_FirestoreV2_Performance_WriteMulti = async (_input: {}): Promise<{}> => {
	await processor_WriteMulti(testCases_WriteMulti[0]);
	return {};
};

export const TestSuite_FirestoreV2_Performance_WriteMulti: Test_WriteMulti = {
	label: 'Firestore write multi performance test',
	testcases: testCases_WriteMulti,
	processor: processor_WriteMulti
};