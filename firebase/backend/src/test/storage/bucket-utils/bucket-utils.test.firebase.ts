import {TestCases_GetAdminBucket, test_GetAdminBucket} from './getMainBucket.js';
import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_GetOrCreateBucket, test_GetOrCreateBucket} from './getOrCreateBucket.js';
import {expect} from 'chai';

type TestCase_GetAdminBucket = typeof TestCases_GetAdminBucket[number];
type TestCase_GetOrCreateBucket = typeof TestCases_GetOrCreateBucket[number];

const descriptionOf_GetAdminBucket = (testCase: TestCase_GetAdminBucket): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_GetAdminBucket) => string)(testCase) : (d ?? 'get admin bucket test');
};
const descriptionOf_GetOrCreateBucket = (testCase: TestCase_GetOrCreateBucket): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_GetOrCreateBucket) => string)(testCase) : (d ?? 'get or create bucket test');
};

const runTestCase_GetAdminBucket = (testCase: TestCase_GetAdminBucket) => () => {
	if (!('result' in testCase))
		throw new Error('GetAdminBucket test case must have result');
	const getExpected = testCase.result as () => Promise<{ bucketName: string }>;
	return runSingleTestCase(test_GetAdminBucket, {
		...testCase,
		result: async (actual: Awaited<ReturnType<typeof test_GetAdminBucket>>) => {
			const expectedBucket = await getExpected();
			expect(actual.bucketName).to.eql(expectedBucket.bucketName);
		}
	});
};

const runTestCase_GetOrCreateBucket = (testCase: TestCase_GetOrCreateBucket) => () => {
	if (!('result' in testCase))
		throw new Error('GetOrCreateBucket test case must have result');
	const getExpected = testCase.result != null && typeof testCase.result === 'function' && testCase.result.length === 0
		? (testCase.result as () => Promise<{ bucketName: string } | undefined>)
		: undefined;
	return runSingleTestCase(test_GetOrCreateBucket, {
		...testCase,
		result: async (actual: Awaited<ReturnType<typeof test_GetOrCreateBucket>>) => {
			const expectedBucket = getExpected != null ? await getExpected() : undefined;
			expect(actual?.bucketName).to.eql(expectedBucket?.bucketName);
		}
	});
};

describe('Firebase Storage - Bucket Utils', () => {
	TestCases_GetAdminBucket.forEach((testCase: TestCase_GetAdminBucket) => {
		it(descriptionOf_GetAdminBucket(testCase), runTestCase_GetAdminBucket(testCase));
	});

	TestCases_GetOrCreateBucket.forEach((testCase: TestCase_GetOrCreateBucket) => {
		it(descriptionOf_GetOrCreateBucket(testCase), runTestCase_GetOrCreateBucket(testCase));
	});
});
