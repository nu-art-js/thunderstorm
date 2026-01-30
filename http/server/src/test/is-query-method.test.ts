/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod} from '@nu-art/api-types';
import {isQueryMethod} from '../main/index.js';
import {ensureBeLoggedTerminal} from './ensure-belogged.js';
import {expect} from 'chai';

describe('isQueryMethod', () => {
	before(() => ensureBeLoggedTerminal());

	it('returns true for GET and DELETE', () => {
		expect(isQueryMethod(HttpMethod.GET)).to.equal(true);
		expect(isQueryMethod(HttpMethod.DELETE)).to.equal(true);
	});

	it('returns false for POST, PUT, PATCH', () => {
		expect(isQueryMethod(HttpMethod.POST)).to.equal(false);
		expect(isQueryMethod(HttpMethod.PUT)).to.equal(false);
		expect(isQueryMethod(HttpMethod.PATCH)).to.equal(false);
	});

	it('returns false for OPTIONS, HEAD, ALL', () => {
		expect(isQueryMethod(HttpMethod.OPTIONS)).to.equal(false);
		expect(isQueryMethod(HttpMethod.HEAD)).to.equal(false);
		expect(isQueryMethod(HttpMethod.ALL)).to.equal(false);
	});
});
