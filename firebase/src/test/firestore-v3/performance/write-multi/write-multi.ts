import {firestore, testInstance1} from '../../_core/consts';
import {TestSuite} from '@thunder-storm/common/test-index';
import {DBDef_V3, deepClone, PreDB, tsValidateMustExist} from '@thunder-storm/common';
import {expect} from 'chai';
import {DB_Type, DBProto_Type} from '../../_entity';

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

export const TestSuite_FirestoreV2_Performance_WriteMulti: TestSuite<{}, {}> = {
	label: 'Firestore write multi performance test',
	testcases: [{description: 'performance - set.all', result: [], input: {}}],
	processor: async (testCase) => {
		const collection = firestore.getCollection<DBProto_Type>(dbDef);
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		const docNumber = 50000;

		console.log(`Initiating ${docNumber} items for performance test...`);
		const toCreate: PreDB<DB_Type>[] = [];
		for (let i = 0; i < docNumber; i++)
			toCreate.push(deepClone(testInstance1));

		// const docs = collection.doc.allItems(toCreate);

		console.log('Starting bulk set');
		let t0 = performance.now();
		// await collection.bulkWrite(docs, 'create', toCreate as DB_Type[]);
		await collection.create.all(toCreate, undefined, 'bulk');
		let t1 = performance.now();
		let allDocs = await collection.collection.listDocuments();
		console.log(`Created ${docNumber} items - time: ${(t1 - t0)} ms`);
		expect(allDocs.length).to.eql(docNumber);

		console.log('Deleting collection...');
		await collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();

		console.log('Starting batch set');
		t0 = performance.now();
		// await collection.bulkWrite(docs, 'set', toCreate as DB_Type[]);
		await collection.set.all(toCreate, undefined);
		t1 = performance.now();
		allDocs = await collection.collection.listDocuments();
		console.log(`Created ${docNumber} items - time: ${(t1 - t0)} ms`);
		expect(allDocs.length).to.eql(docNumber);
	}
};