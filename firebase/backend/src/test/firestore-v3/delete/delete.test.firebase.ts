import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FirestoreV3_Delete, test_FirestoreV3_Delete} from './delete.js';
import {compare, sortArray} from '@nu-art/ts-common';
import {expect} from 'chai';

const runTestCase = (testCase: typeof TestCases_FirestoreV3_Delete[number]) => () => {
	const expectedResult = sortArray(testCase.result, item => item.stringValue);
	return runSingleTestCase(test_FirestoreV3_Delete, {
		...testCase,
		result: async (actual) => {
			expect(compare(actual, expectedResult)).to.be.true;
		}
	});
};

describe('Firestore v3 - Delete', () => {
	TestCases_FirestoreV3_Delete.forEach(testCase => {
		it(testCase.description || 'delete test', runTestCase(testCase));
	});
});
