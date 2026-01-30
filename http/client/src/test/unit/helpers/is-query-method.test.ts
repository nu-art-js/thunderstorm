/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod, isQueryMethod} from '../../../main/index.js';
import {expect} from 'chai';

describe('isQueryMethod', () => {
	it('returns true for GET', () => {
		expect(isQueryMethod(HttpMethod.GET)).to.equal(true);
	});

	it('returns true for DELETE', () => {
		expect(isQueryMethod(HttpMethod.DELETE)).to.equal(true);
	});

	it('returns false for POST', () => {
		expect(isQueryMethod(HttpMethod.POST)).to.equal(false);
	});

	it('returns false for PUT', () => {
		expect(isQueryMethod(HttpMethod.PUT)).to.equal(false);
	});

	it('returns false for PATCH', () => {
		expect(isQueryMethod(HttpMethod.PATCH)).to.equal(false);
	});

	it('returns false for unknown method string', () => {
		expect(isQueryMethod('OPTIONS')).to.equal(false);
		expect(isQueryMethod('HEAD')).to.equal(false);
	});
});
