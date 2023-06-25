import {BucketUtils, getMainBucketInput, getMainBucketResult, storage} from '../_core/consts';
import {expect} from 'chai';

export const bucketUtilsTestCases: BucketUtils['testcases'] = [
	{
		description: 'get main bucket',
		result: getMainBucketResult,
		input: getMainBucketInput
	}
];


export const TestSuite_GetAdminBucket: BucketUtils = {
	label: 'Firebase Storage - Get Admin Bucket',
	testcases: bucketUtilsTestCases,
	processor: async (testCase) => {
		const bucketWrapper = await storage.getMainBucket();
		expect(bucketWrapper).to.eql(await testCase.result!());
	}
};