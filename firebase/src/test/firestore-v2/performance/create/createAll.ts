import {firestore, testInstance1} from '../../_core/consts';
import {DB_Type} from '../../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {DBDef, deepClone, PreDB, tsValidateMustExist} from '@nu-art/ts-common';
import {expect} from "chai";

const dbDef: DBDef<DB_Type> = {
	dbName: 'firestore-create-performance-tests',
	entityName: 'create-performance-test',
	validator: tsValidateMustExist
}

export const TestSuite_FirestoreV2_Performance_CreateAll: TestSuite<{}, {}> = {
	label: 'Firestore create.all performance test',
	testcases: [{description: 'performance - create.all', result: [], input: {}}],
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>(dbDef);
		await collection.deleteCollection();

		const toCreate: PreDB<DB_Type>[] = []
		const docNumber = 50000;
		for (let i=0; i<docNumber; i++)
			toCreate.push(deepClone(testInstance1));

		const t0 = performance.now();
		await collection.create.all(toCreate);
		const t1 = performance.now();
		const allDocs = await collection.collection.listDocuments();
		expect(allDocs.length).to.eql(docNumber);

		console.log(`Created ${docNumber} items - time: ${(t1 - t0)} ms`);
	}
};