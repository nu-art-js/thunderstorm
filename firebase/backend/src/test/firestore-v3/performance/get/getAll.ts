import {firestore, testInstance1} from '../../../_entity/_core/consts.js';
import {Database} from '@nu-art/db-api-shared';
import {deepClone, tsValidateMustExist, UniqueId} from '@nu-art/ts-common';
import {expect} from 'chai';
import {DatabaseDef_Type} from '../../../_entity/type/index.js';
import {FirestoreCollection} from '../../../../main/firestore/FirestoreCollection.js';

type TestCase_GetAll = { description?: string; input: {}; result: {} };
type Test_GetAll = { label: string; testcases: TestCase_GetAll[]; processor: (testCase: TestCase_GetAll) => Promise<void> };

const dbDef: Database<DatabaseDef_Type> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	dbKey: 'firestore-get-all-tests',
	entityName: 'get-all-test',
	versions: ['1.0.0'],
	frontend: {
		group: 'test',
		name: 'firestore-get-all-tests'
	},
	backend: {
		name: 'firestore-get-all-tests'
	}
};

//firestore getAll performing much better
const asyncGetAll = async (_ids: UniqueId[], collection: FirestoreCollection<any>) => {
	const docs = collection.doc.all(_ids);
	return await Promise.all(docs.map(_doc => _doc.get()));
};

const testCases_GetAll: TestCase_GetAll[] = [
	{description: 'performance - firestoreGetAll vs. promiseAllGet', result: [], input: {}}
];

const processor_GetAll = async (_testCase: TestCase_GetAll): Promise<void> => {
	const collection = firestore.getCollection<DatabaseDef_Type>(dbDef);
	await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	const inserted = await collection.create.all(Array(10).fill(deepClone(testInstance1)));
	const _ids = inserted.map(_item => _item._id);

	const runs = 100;

	let getAllSum = 0;
	for (let i = 0; i < runs; i++) {
		const t0 = performance.now();
		await collection.query.all(_ids);
		const t1 = performance.now();
		getAllSum += (t1 - t0);
	}

	let asyncGetAllSum = 0;
	for (let i = 0; i < runs; i++) {
		const t0 = performance.now();
		await asyncGetAll(_ids, collection);
		const t1 = performance.now();
		asyncGetAllSum += (t1 - t0);
	}

	console.log(`Average run time of getAll: ${getAllSum / runs}`);
	console.log(`Average run time of asyncGetAll: ${asyncGetAllSum / runs}`);
	expect(true).to.eql(true);
};

export const TestCases_FirestoreV3_Performance_GetAll = testCases_GetAll;

export const test_FirestoreV3_Performance_GetAll = async (_input: {}): Promise<{}> => {
	await processor_GetAll(testCases_GetAll[0]);
	return {};
};

export const TestSuite_FirestoreV3_Performance_GetAll: Test_GetAll = {
	label: 'Firestore getAll vs Promise.all get() performance test',
	testcases: testCases_GetAll,
	processor: processor_GetAll
};