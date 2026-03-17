import {runSingleTestCase} from '@nu-art/testalot';
import {TestCase_FirestoreV3_Set, TestCases_FirestoreV3_Set, test_FirestoreV3_Set, type SetTestResult} from './set.js';
import {compare, DB_Object, PreDB, removeDBObjectKeys, sortArray} from '@nu-art/ts-common';
import {expect} from 'chai';
import {_EmptyQuery} from '@nu-art/firebase-shared';
import {firestore} from '../../_entity/_core/consts.js';
import {DatabaseDef_Type, DB_Type} from '../_entity.js';
import {Database} from '@nu-art/db-api-shared';
import {tsValidateMustExist} from '@nu-art/ts-common';

const descriptionOf = (testCase: TestCase_FirestoreV3_Set): string =>
	typeof testCase.description === 'function' ? testCase.description(testCase) : (testCase.description ?? 'set test');

const dbDef: Database<DatabaseDef_Type> = {
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

const runTestCase = (testCase: TestCase_FirestoreV3_Set) => async () => {
	if (!('result' in testCase))
		throw new Error('Set test must have result');
	await runSingleTestCase(test_FirestoreV3_Set, {
		...testCase,
		result: async (_actual) => {
			const collection = firestore.getCollection<DatabaseDef_Type>(dbDef);
			const sortedRemaining = sortArray((await collection.query.custom(_EmptyQuery)), item => item._uniqueId);
			const expectedResult = await Promise.resolve((testCase.result as SetTestResult)());
			const allResults = sortArray([...expectedResult.created ?? [],
																		...expectedResult.updated ?? [],
																		...expectedResult.notUpdated ?? []], item => item._uniqueId);

			expect(compare(sortedRemaining.map(removeDBObjectKeys), (allResults as DB_Object[]).map(removeDBObjectKeys))).to.be.true;

			//assert timestamps correctly updated
			const sortedInserted = sortArray(await collection.query.custom(_EmptyQuery), item => item._uniqueId);
			expectedResult.updated?.forEach((_preDBUpdated: PreDB<DB_Type>) => {
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
		it(descriptionOf(testCase), runTestCase(testCase));
	});
});
