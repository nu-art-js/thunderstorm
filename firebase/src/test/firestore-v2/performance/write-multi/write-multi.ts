import {firestore, testInstance1} from '../../_core/consts';
import {DB_Type} from '../../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {DBDef, deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {expect} from 'chai';

const dbDef: DBDef<DB_Type> = {
	dbName: 'firestore-create-performance-tests',
	entityName: 'create-performance-test',
	validator: tsValidateMustExist
};

export const TestSuite_FirestoreV2_Performance_WriteMulti: TestSuite<{}, {}> = {
	label: 'Firestore write multi performance test',
	testcases: [{description: 'performance - set.all', result: [], input: {}}],
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(dbDef);
		await collection.deleteCollection();

		const docNumber = 50000;

		console.log(`Initiating ${docNumber} items for performance test...`);
		const toCreate: PreDB<DB_Type>[] = [];
		for (let i = 0; i < docNumber; i++)
			toCreate.push(deepClone(testInstance1));

		const docs = collection.doc.allItems(toCreate)

		console.log('Starting bulk set')
		let t0 = performance.now();
		await collection.bulkWrite(docs, 'create', toCreate as DB_Type[])
		let t1 = performance.now();
		let allDocs = await collection.collection.listDocuments();
		console.log(`Created ${docNumber} items - time: ${(t1 - t0)} ms`);
		expect(allDocs.length).to.eql(docNumber);

		console.log('Deleting collection...')
		await collection.deleteCollection();

		console.log('Starting batch set')
		t0 = performance.now();
		await collection.bulkWrite(docs, 'set', toCreate as DB_Type[])
		t1 = performance.now();
		allDocs = await collection.collection.listDocuments();
		console.log(`Created ${docNumber} items - time: ${(t1 - t0)} ms`);
		expect(allDocs.length).to.eql(docNumber);
	}
};