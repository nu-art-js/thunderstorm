import {firestore, testInstance1} from '../../_core/consts';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {DBDef_V3, deepClone, tsValidateMustExist, UniqueId} from '@nu-art/ts-common';
import {expect} from 'chai';
import {DBProto_Type} from '../../../_entity/type/shared';
import {FirestoreCollectionV3} from '../../../../main/backend/firestore-v3/FirestoreCollectionV3';

const dbDef: DBDef_V3<DBProto_Type> = {
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
const asyncGetAll = async (_ids: UniqueId[], collection: FirestoreCollectionV3<any>) => {
	const docs = collection.doc.all(_ids);
	return await Promise.all(docs.map(_doc => _doc.get()));
};

export const TestSuite_FirestoreV3_Performance_GetAll: TestSuite<{}, {}> = {
	label: 'Firestore getAll vs Promise.all get() performance test',
	testcases: [{description: 'performance - firestoreGetAll vs. promiseAllGet', result: [], input: {}}],
	processor: async (testCase) => {
		const collection = firestore.getCollection<DBProto_Type>(dbDef);
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
	}
};