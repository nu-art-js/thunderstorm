/*
 * @nu-art/rate-limit-backend - Sliding-window rate limiting over db-api with an http 429 middleware
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {deriveRateLimitBucketId} from '../main/bucket-id.js';

type Input_BucketId = { pepper: string; policyKey: string; subject: string };
type TestCase_BucketId = TestModel<Input_BucketId, string>;

const test_BucketId = async (input: Input_BucketId): Promise<string> => deriveRateLimitBucketId(input.pepper, input.policyKey, input.subject);
const run_BucketId = (testCase: TestCase_BucketId) => () => runSingleTestCase(test_BucketId, testCase);

const base: Input_BucketId = {pepper: 'pepper-a', policyKey: 'auth.login.ip', subject: '203.0.113.7'};

describe('rate-limit - deriveRateLimitBucketId', () => {
	it('is a 32 char db-api unique id that does not contain the subject', run_BucketId({
		input: base,
		result: async (id: string) => {
			expect(id).to.match(/^[0-9a-f]{32}$/);
			expect(id).to.not.contain('203.0.113.7');
		},
	}));

	it('is deterministic', async () => {
		expect(deriveRateLimitBucketId(base.pepper, base.policyKey, base.subject)).to.equal(deriveRateLimitBucketId(base.pepper, base.policyKey, base.subject));
	});

	it('changes with the pepper, the policy and the subject', async () => {
		const reference = deriveRateLimitBucketId(base.pepper, base.policyKey, base.subject);
		expect(deriveRateLimitBucketId('pepper-b', base.policyKey, base.subject)).to.not.equal(reference);
		expect(deriveRateLimitBucketId(base.pepper, 'auth.login.email', base.subject)).to.not.equal(reference);
		expect(deriveRateLimitBucketId(base.pepper, base.policyKey, '203.0.113.8')).to.not.equal(reference);
	});

	it('does not let policy and subject bleed into each other', async () => {
		expect(deriveRateLimitBucketId(base.pepper, 'a', 'b\nc')).to.not.equal(deriveRateLimitBucketId(base.pepper, 'a\nb', 'c'));
	});

	it('refuses an empty pepper (no unkeyed fallback)', run_BucketId({
		input: {...base, pepper: ''},
		error: {expected: 'pepper is empty'},
	}));

	it('refuses an empty subject', run_BucketId({
		input: {...base, subject: ''},
		error: {expected: 'subject is empty'},
	}));
});
