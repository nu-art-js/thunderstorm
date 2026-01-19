import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_Storage_Write, test_Storage_Write} from './write-to-files.js';
import {expect} from 'chai';
import {getSpecificBucketInput, storage} from '../_core/consts.js';

const runTestCase = (testCase: typeof TestCases_Storage_Write[number]) => () => {
	return runSingleTestCase(test_Storage_Write, {
		...testCase,
		result: async (actual) => {
			const bucket = await storage.getOrCreateBucket(getSpecificBucketInput);
			const file = await bucket.getFile(testCase.input.filePath);
			const expectedResult = testCase.result;
			expect(actual.toString()).to.eql(testCase.input.stringify ? JSON.stringify(expectedResult) : expectedResult.toString());
		}
	});
};

describe('Firebase Storage - Write', () => {
	TestCases_Storage_Write.forEach(testCase => {
		it(testCase.description || 'write test', runTestCase(testCase));
	});
});
