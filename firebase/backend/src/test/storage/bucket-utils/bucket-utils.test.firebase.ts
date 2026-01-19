import {TestCases_GetAdminBucket, test_GetAdminBucket} from './getMainBucket.js';
import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_GetOrCreateBucket, test_GetOrCreateBucket} from './getOrCreateBucket.js';
import {expect} from 'chai';
import {getMainBucketResult} from '../_core/consts.js';

const runTestCase_GetAdminBucket = (testCase: typeof TestCases_GetAdminBucket[number]) => () => {
	return runSingleTestCase(test_GetAdminBucket, {
		...testCase,
		result: async (actual) => {
			const bucketWrapper = await actual();
			const expectedBucket = await testCase.result();
			expect(bucketWrapper.bucketName).to.eql(expectedBucket.bucketName);
		}
	});
};

const runTestCase_GetOrCreateBucket = (testCase: typeof TestCases_GetOrCreateBucket[number]) => () => {
	return runSingleTestCase(test_GetOrCreateBucket, {
		...testCase,
		result: async (actual) => {
			const bucketWrapper = await actual();
			const expectedBucket = await testCase.result();
			expect(bucketWrapper.bucketName).to.eql(expectedBucket.bucketName);
		}
	});
};

describe('Firebase Storage - Bucket Utils', () => {
	TestCases_GetAdminBucket.forEach(testCase => {
		it(testCase.description || 'get admin bucket test', runTestCase_GetAdminBucket(testCase));
	});

	TestCases_GetOrCreateBucket.forEach(testCase => {
		it(testCase.description || 'get or create bucket test', runTestCase_GetOrCreateBucket(testCase));
	});
});
