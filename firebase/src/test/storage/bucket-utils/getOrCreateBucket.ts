import {BucketUtils, getSpecificBucketInput, getSpecificBucketResult, invalidBucketNameInput, storage} from '../_core/consts';
import {expect} from 'chai';

const getOrCreateTests: BucketUtils['testcases'] = [{
	description: 'get specific bucket',
	result: getSpecificBucketResult,
	input: getSpecificBucketInput
},
	{
		description: 'invalid bucket name',
		result: undefined,
		input: invalidBucketNameInput
	}];

export const TestSuite_GetOrCreateBucket: BucketUtils = {
	label: 'Firebase Storage - Get or create bucket',
	testcases: getOrCreateTests,
	processor: async (testCase) => {
		let result;
		const expected = await testCase.result?.();

		try {
			result = await storage.getOrCreateBucket(testCase.input);
		} catch (err) {
			result = undefined;
		}

		expect(result?.bucketName).to.eql(expected?.bucketName);
	}
};