import {BucketUtils, getSpecificBucketInput, getSpecificBucketResult, invalidBucketNameInput, storage} from '../_core/consts.js';
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

export const TestCases_GetOrCreateBucket = getOrCreateTests;

export const test_GetOrCreateBucket = async (input: string | undefined) => {
	try {
		return await storage.getOrCreateBucket(input);
	} catch {
		return undefined;
	}
};

export const TestSuite_GetOrCreateBucket: BucketUtils = {
	label: 'Firebase Storage - Get or create bucket',
	testcases: getOrCreateTests,
	processor: async (testCase: BucketUtils['testcases'][number]) => {
		let result;
		const getExpected = testCase && 'result' in testCase ? (testCase.result as (() => Promise<{ bucketName: string } | undefined>) | undefined) : undefined;
		const expected = getExpected ? await getExpected() : undefined;

		try {
			result = await storage.getOrCreateBucket(testCase.input);
		} catch (err) {
			result = undefined;
		}

		expect(result?.bucketName).to.eql(expected?.bucketName);
	}
};