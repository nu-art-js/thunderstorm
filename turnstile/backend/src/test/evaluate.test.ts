/*
 * @nu-art/turnstile-backend - Fail-closed Cloudflare Turnstile verification for Thunderstorm APIs
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {evaluateSiteverify, type TurnstileExpectations, type TurnstileOutcome} from '../main/evaluate.js';
import type {TurnstileSiteverify_Response} from '../main/external/api-def.js';

type Input = { response: TurnstileSiteverify_Response; expect?: TurnstileExpectations };
type TestCase = TestModel<Input, TurnstileOutcome>;

const test = async (input: Input): Promise<TurnstileOutcome> => evaluateSiteverify(input.response, input.expect ?? {hostnames: []});
const run = (testCase: TestCase) => () => runSingleTestCase(test, testCase);

describe('turnstile - evaluateSiteverify', () => {
	it('accepts success without expectations', run({
		input: {response: {success: true, hostname: 'App.Example.com'}},
		result: {outcome: 'accepted', hostname: 'app.example.com'},
	}));

	it('rejects success:false and keeps the error codes', run({
		input: {response: {success: false, 'error-codes': ['invalid-input-response']}},
		result: {outcome: 'rejected', reason: 'siteverify_failed', errorCodes: ['invalid-input-response']},
	}));

	it('rejects a response without success (fail closed)', run({
		input: {response: {} as TurnstileSiteverify_Response},
		result: {outcome: 'rejected', reason: 'siteverify_failed', errorCodes: []},
	}));

	it('accepts an allowed hostname, case-insensitively', run({
		input: {response: {success: true, hostname: 'APP.example.com'}, expect: {hostnames: ['app.example.com']}},
		result: {outcome: 'accepted', hostname: 'app.example.com'},
	}));

	it('rejects a hostname outside the allowed list', run({
		input: {response: {success: true, hostname: 'evil.example.net'}, expect: {hostnames: ['app.example.com']}},
		result: {outcome: 'rejected', reason: 'hostname_mismatch', hostname: 'evil.example.net'},
	}));

	it('rejects a missing hostname when hostnames are expected', run({
		input: {response: {success: true}, expect: {hostnames: ['app.example.com']}},
		result: {outcome: 'rejected', reason: 'hostname_mismatch', hostname: ''},
	}));

	it('accepts the expected action', run({
		input: {response: {success: true, hostname: 'a.com', action: 'login'}, expect: {hostnames: [], action: 'login'}},
		result: {outcome: 'accepted', hostname: 'a.com', action: 'login'},
	}));

	it('rejects another action', run({
		input: {response: {success: true, hostname: 'a.com', action: 'signup'}, expect: {hostnames: [], action: 'login'}},
		result: {outcome: 'rejected', reason: 'action_mismatch', hostname: 'a.com'},
	}));
});
