import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Set, test_FirestoreV3_Set} from './set.js';
import {compare, DB_Object, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {expect} from 'chai';
import {_EmptyQuery} from '../../../main/index.js';
import {firestore} from '../_core/consts.js';
import {DBProto_Type} from '../_entity.js';
import {DBDef_V3, tsValidateMustExist} from '@nu-art/ts-common';

const dbDef: DBDef_V3<DBProto_Type> = {
	modifiablePropsValidator: tsValidateMustExist,
	generatedPropsValidator: {},
	dbKey: 'firestore-set-tests',
	entityName: 'set-test',
	versions: ['1.0.0'],
	frontend: {
		group: 'test',
		name: 'firestore-set-tests'
	},
	backend: {
		name: 'firestore-set-tests',
	}
};

const runTestCase = (testCase: typeof TestCases_FirestoreV3_Set[number]) => async () => {
	const result = await runSingleTestCase(test_FirestoreV3_Set, {
		...testCase,
		result: async (actual) => {
			const collection = firestore.getCollection<DBProto_Type>(dbDef);
			const sortedRemaining = sortArray((await collection.query.custom(_EmptyQuery)), item => item._uniqueId);
			const expectedResult = testCase.result();
			const allResults = sortArray([...expectedResult.created ?? [], ...expectedResult.updated ?? [], ...expectedResult.notUpdated ?? []], item => item._uniqueId);
			
			expect(compare(sortedRemaining.map(removeDBObjectKeys), (allResults as DB_Object[]).map(removeDBObjectKeys))).to.be.true;
			
			//assert timestamps correctly updated
			const sortedInserted = sortArray(await collection.query.custom(_EmptyQuery), item => item._uniqueId);
			expectedResult.updated?.forEach((_preDBUpdated) => {
				const _itemIndex = sortedRemaining.findIndex(_item => _item._uniqueId === _preDBUpdated._uniqueId);
				if (_itemIndex >= 0) {
					expect(sortedInserted[_itemIndex].__created).to.eql(sortedRemaining[_itemIndex].__created);
					expect(sortedInserted[_itemIndex].__updated).to.be.lte(sortedRemaining[_itemIndex].__updated);
				}
			});
		}
	});
};

describe('Firestore v3 - Set', () => {
	TestCases_FirestoreV3_Set.forEach(testCase => {
		it(testCase.description || 'set test', runTestCase(testCase));
	});
});
