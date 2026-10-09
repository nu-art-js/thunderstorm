/*
 * @nu-art/rate-limit-shared - Sliding-window rate-limit policies, decision logic and bucket entity contract
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {decideRateLimit, resolveRateLimitPolicy} from '../main/decide.js';
import type {RateLimitDecision, RateLimitPolicy, RateLimitPolicyOverride} from '../main/types.js';

const policy: RateLimitPolicy = {key: 'test.policy', windowMs: 1000, limit: 3};

type Input_Decide = { hits: number[]; now: number; policy?: Pick<RateLimitPolicy, 'windowMs' | 'limit'> };
type TestCase_Decide = TestModel<Input_Decide, RateLimitDecision>;

const test_Decide = async (input: Input_Decide): Promise<RateLimitDecision> => decideRateLimit(input.hits, input.policy ?? policy, input.now);
const run_Decide = (testCase: TestCase_Decide) => () => runSingleTestCase(test_Decide, testCase);

describe('rate-limit - decideRateLimit', () => {
	it('allows the first hit and opens a window', run_Decide({
		input: {hits: [], now: 10_000},
		result: {action: 'allow', hits: [10_000], expiresAt: 11_000},
	}));

	it('allows up to the limit', run_Decide({
		input: {hits: [9_500, 9_800], now: 10_000},
		result: {action: 'allow', hits: [9_500, 9_800, 10_000], expiresAt: 11_000},
	}));

	it('rejects once the limit is reached, retry when the oldest counted hit leaves', run_Decide({
		input: {hits: [9_500, 9_800, 9_900], now: 10_000},
		result: {action: 'reject', retryAfterMs: 500},
	}));

	it('drops hits outside the window (boundary is exclusive)', run_Decide({
		input: {hits: [9_000, 9_100, 9_900], now: 10_000},
		result: {action: 'allow', hits: [9_100, 9_900, 10_000], expiresAt: 11_000},
	}));

	it('sorts stored hits and ignores non-finite values', run_Decide({
		input: {hits: [9_900, Number.NaN, 9_200, Number.POSITIVE_INFINITY], now: 10_000},
		result: {action: 'allow', hits: [9_200, 9_900, 10_000], expiresAt: 11_000},
	}));

	it('retry-after uses the hit that must expire when more than limit hits are stored', run_Decide({
		input: {hits: [9_100, 9_200, 9_300, 9_400], now: 10_000},
		result: {action: 'reject', retryAfterMs: 200},
	}));

	it('limit 1 rejects a second hit inside the window', run_Decide({
		input: {hits: [9_999], now: 10_000, policy: {windowMs: 1000, limit: 1}},
		result: {action: 'reject', retryAfterMs: 999},
	}));
});

type Input_Resolve = { policy: RateLimitPolicy; override?: RateLimitPolicyOverride };
type TestCase_Resolve = TestModel<Input_Resolve, RateLimitPolicy>;

const test_Resolve = async (input: Input_Resolve): Promise<RateLimitPolicy> => resolveRateLimitPolicy(input.policy, input.override);
const run_Resolve = (testCase: TestCase_Resolve) => () => runSingleTestCase(test_Resolve, testCase);

describe('rate-limit - resolveRateLimitPolicy', () => {
	it('keeps the code policy without an override', run_Resolve({
		input: {policy},
		result: policy,
	}));

	it('applies a partial override and keeps the key', run_Resolve({
		input: {policy, override: {limit: 10}},
		result: {key: 'test.policy', windowMs: 1000, limit: 10},
	}));

	it('rejects a zero limit', run_Resolve({
		input: {policy, override: {limit: 0}},
		error: {expected: 'invalid limit'},
	}));

	it('rejects a fractional limit', run_Resolve({
		input: {policy, override: {limit: 1.5}},
		error: {expected: 'invalid limit'},
	}));

	it('rejects a non-positive window', run_Resolve({
		input: {policy, override: {windowMs: 0}},
		error: {expected: 'invalid windowMs'},
	}));

	it('rejects an empty key', run_Resolve({
		input: {policy: {key: '', windowMs: 1000, limit: 1}},
		error: {expected: 'must have a key'},
	}));
});
