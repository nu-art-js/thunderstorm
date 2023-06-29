import {firestore, id_inner2, id_outer1} from '../_core/consts';
import {expect} from 'chai';
import {DB_Object, ArrayType, exists, filterInstances} from '@nu-art/ts-common';
import {TestModel_FreeForm} from './types';


export const FreeForm_TestCase1: ArrayType<TestModel_FreeForm['testcases']> = {
	description: 'transaction update',
	result: [],

	input: {
		run: async () => {
			const collection = firestore.getCollection<DB_Object & { values: string[] }>('free-form_testcase1');
			const dbItems = await collection.create.all([{values: ['val1', 'val2', 'val3']}, {values: ['val3', 'val4', 'val5']}]);

			await firestore.firestore.runTransaction(async (transaction) => {
				const item = await collection.query.unique(dbItems[0]._id, transaction);
				item.values = item.values.filter(id => id !== 'val3');

				return collection.update.item({});
			});
			const updatedReferencedInnerItems = await collectionInner.query.custom({where: {parentId: id_outer1}});
			expect(updatedReferencedInnerItems.length).to.eql(6); // out of the 3 inner items updated in the transaction, 2 already had the parentId.

		}
	}
};