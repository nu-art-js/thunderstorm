/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller, HttpMethod} from '../../../main/index.js';
import type {QueryApi} from '../../../main/types/api-types.js';
import {createTestApiDef, createTestClient} from '../../helpers.js';
import {expect} from 'chai';

type GetResponse = {url: string; args: Record<string, string>};
type GetApi = QueryApi<GetResponse, {test?: string}>;

describe('ApiCaller decorator - lazy getter', () => {
	const client = createTestClient();

	it('calls ApiDef getter with this equal to instance and uses returned ApiDef for request', async () => {
		const apiDefFromGetter = createTestApiDef<GetApi>(HttpMethod.GET, '/get');
		let receivedThis: unknown = null;
		class C {
			getApiDef() {
				receivedThis = this;
				return apiDefFromGetter;
			}

			@ApiCaller(function (m: C) {
				return m.getApiDef();
			}, {httpClient: client})
			async fetch(_p?: Record<string, string>) {
				return undefined as any;
			}
		}
		const c = new C();
		const response = await c.fetch({test: 'lazy'});
		expect(receivedThis).to.equal(c);
		expect(response).to.be.an('object');
		expect(response.args).to.deep.equal({test: 'lazy'});
		expect(response.url).to.include('test=lazy');
	}).timeout(30000);
});
