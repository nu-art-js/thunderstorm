import {firestore, testInstance1} from '../../_core/consts';
import {DB_Type} from '../../_core/types';
import {TestSuite} from '@nu-art/ts-common/test-index';
import {deepClone, UniqueId} from '@nu-art/ts-common';
import {expect} from "chai";
import {FirestoreCollectionV2} from "../../../../main/backend/firestore-v2/FirestoreCollectionV2";

//firestore getAll performing much better
const asyncGetAll = async (_ids: UniqueId[], collection: FirestoreCollectionV2<any>) => {
	const docs = _ids.map(collection.getDocWrapper);
	return await Promise.all(docs.map(_doc => _doc.get()));
};

export const TestSuite_FirestoreV2_Performance_GetAll: TestSuite<{}, {}> = {
	label: 'Firestore getAll vs Promise.all get() performance test',
	testcases: [{description: 'performance - firestoreGetAll vs. promiseAllGet', result: [], input: {}}],
	processor: async (testCase) => {
		const collection = firestore.getCollection<DB_Type>('firestore-getAll-tests');
		await collection.deleteCollection();
		const inserted = await collection.create.all(Array(10).fill(deepClone(testInstance1)));
		const _ids = inserted.map(_item => _item._id);

		const runs = 100;

		let getAllSum = 0;
		for(let i = 0; i < runs; i++) {
			const t0 = performance.now();
			await collection.getAll(_ids);
			const t1 = performance.now();
			getAllSum += (t1 - t0);
		}

		let asyncGetAllSum = 0;
		for(let i = 0; i < runs; i++) {
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
