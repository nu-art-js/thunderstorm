import {BucketUtils, getMainBucketInput, getMainBucketResult, storage} from '../_core/consts.js';
import {expect} from 'chai';

export const bucketUtilsTestCases: BucketUtils['testcases'] = [
	{
		description: 'get main bucket',
		result: getMainBucketResult,
		input: getMainBucketInput
	}
];

export const TestCases_GetAdminBucket = bucketUtilsTestCases;

export const test_GetAdminBucket = async (_input: string | undefined) =>
	await storage.getMainBucket();

export const TestSuite_GetAdminBucket: BucketUtils = {
	label: 'Firebase Storage - Get Admin Bucket',
	testcases: bucketUtilsTestCases,
	processor: async (testCase: BucketUtils['testcases'][number]) => {
		const bucketWrapper = await storage.getMainBucket();
		expect(bucketWrapper.bucketName).to.eql((await testCase.result!()).bucketName);
	}
};