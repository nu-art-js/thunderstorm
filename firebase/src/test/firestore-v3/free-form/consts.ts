import {firestore} from '../_core/consts';
import {expect} from 'chai';
import {ArrayType, DBDef_V3, exists, tsValidateMustExist} from '@nu-art/ts-common';
import {DB_FreeForm, DBProto_FreeForm, TestModel_FreeForm} from './types';

const DBDef_FreeForm: DBDef_V3<DBProto_FreeForm> = {
	dbKey: 'free-form_testcase1',
	versions: ['1.0.0'],
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	entityName: 'FreeForm',
	frontend: {
		group: 'test',
		name: 'free-from-test'
	},
	backend: {
		name: 'free-from-test',
	},
};

export const FreeForm_TestCase1: ArrayType<TestModel_FreeForm['testcases']> = {
	description: 'transaction update',
	result: [],
	input: {
		run: async () => {
			const collection = firestore.getCollection<DBProto_FreeForm>(DBDef_FreeForm);
			const dbItems = await collection.create.all([{values: ['val1', 'val2', 'val3']}, {values: ['val3', 'val4', 'val5']}]);

			await firestore.firestore.runTransaction(async (transaction) => {
				const item = (await collection.query.unique(dbItems[0]._id, transaction))!;
				expect(true).to.eql(exists(item));
				item.values = item.values.filter(id => id !== 'val3');

				return collection.set.item({} as DB_FreeForm);
			});
			// const updatedReferencedInnerItems = await collectionInner.query.custom({where: {parentId: id_outer1}});
			// expect(updatedReferencedInnerItems.length).to.eql(6); // out of the 3 inner items updated in the transaction, 2 already had the parentId.
		}
	}
};