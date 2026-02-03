import {runSingleTestCase} from '@nu-art/testalot';
import {TestCase_FirestoreV3_Delete, TestCases_FirestoreV3_Delete, test_FirestoreV3_Delete} from './delete.js';
import {compare, PreDB, sortArray} from '@nu-art/ts-common';
import {expect} from 'chai';
import {DB_Type} from '../_entity.js';

const runTestCase = (testCase: TestCase_FirestoreV3_Delete) => () => {
	if (!('result' in testCase))
		throw new Error('Delete test case must have result');
	const expectedResult = sortArray(testCase.result as PreDB<DB_Type>[], (item: PreDB<DB_Type>) => item.stringValue);
	return runSingleTestCase(test_FirestoreV3_Delete, {
		...testCase,
		result: async (actual) => {
			expect(compare(actual, expectedResult)).to.be.true;
		}
	});
};

const descriptionOf = (testCase: TestCase_FirestoreV3_Delete): string =>
	typeof testCase.description === 'function' ? testCase.description(testCase) : (testCase.description ?? 'delete test');

describe('Firestore v3 - Delete', () => {
	TestCases_FirestoreV3_Delete.forEach(testCase => {
		it(descriptionOf(testCase), runTestCase(testCase));
	});
});
