import {TestCases_GetAdminBucket, test_GetAdminBucket} from './getMainBucket.js';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {TestCases_GetOrCreateBucket, test_GetOrCreateBucket} from './getOrCreateBucket.js';
import {expect} from 'chai';

type TestCase_GetAdminBucket = (typeof TestCases_GetAdminBucket)[number];
type TestCase_GetOrCreateBucket = (typeof TestCases_GetOrCreateBucket)[number];

type GetAdminBucketResult = Awaited<ReturnType<typeof test_GetAdminBucket>>;
type GetOrCreateBucketResult = Awaited<ReturnType<typeof test_GetOrCreateBucket>>;

const descriptionOf_GetAdminBucket = (testCase: TestCase_GetAdminBucket): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_GetAdminBucket) => string)(testCase) : (d ?? 'get admin bucket test');
};
const descriptionOf_GetOrCreateBucket = (testCase: TestCase_GetOrCreateBucket): string => {
	const d = testCase.description;
	return typeof d === 'function' ? (d as (tc: TestCase_GetOrCreateBucket) => string)(testCase) : (d ?? 'get or create bucket test');
};

const getExpectedBucket = (tc: unknown): (() => Promise<{ bucketName: string } | undefined>) | undefined =>
	(tc as { result?: () => Promise<{ bucketName: string } | undefined> }).result;

const runTestCase_GetAdminBucket = (testCase: TestCase_GetAdminBucket) => () => {
	if (!('result' in testCase))
		throw new Error('GetAdminBucket test must have result');
	const getExpected = getExpectedBucket(testCase) ?? (async () => ({ bucketName: '' }));
	return runSingleTestCase(test_GetAdminBucket, {
		...testCase,
		result: async (actual: GetAdminBucketResult) => {
			const expectedBucket = await getExpected();
			if (expectedBucket == null)
				throw new Error('GetAdminBucket test expects a bucket');
			expect(actual.bucketName).to.eql(expectedBucket.bucketName);
		}
	} as TestModel<string | undefined, GetAdminBucketResult>);
};

const runTestCase_GetOrCreateBucket = (testCase: TestCase_GetOrCreateBucket) => () => {
	if (!('result' in testCase))
		throw new Error('GetOrCreateBucket test must have result');
	const getExpected = getExpectedBucket(testCase) ?? (() => Promise.resolve(undefined));
	return runSingleTestCase(test_GetOrCreateBucket, {
		...testCase,
		result: async (actual: GetOrCreateBucketResult) => {
			const expectedBucket = await getExpected();
			expect(actual?.bucketName).to.eql(expectedBucket?.bucketName);
		}
	} as TestModel<string | undefined, GetOrCreateBucketResult | undefined>);
};

const skipBucketUtilsWithoutStorageEmulator = new Set(['get main bucket', 'get specific bucket']);

describe('Firebase Storage - Bucket Utils', () => {
	describe('GetAdminBucket', () => {
		TestCases_GetAdminBucket.forEach((testCase: TestCase_GetAdminBucket) => {
			const desc = descriptionOf_GetAdminBucket(testCase);
			(skipBucketUtilsWithoutStorageEmulator.has(desc) ? it.skip : it)(desc, runTestCase_GetAdminBucket(testCase));
		});
	});

	describe('GetOrCreateBucket', () => {
		TestCases_GetOrCreateBucket.forEach((testCase: TestCase_GetOrCreateBucket) => {
			const desc = descriptionOf_GetOrCreateBucket(testCase);
			(skipBucketUtilsWithoutStorageEmulator.has(desc) ? it.skip : it)(desc, runTestCase_GetOrCreateBucket(testCase));
		});
	});
});
