/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import request from 'supertest';
import {expect} from 'chai';
import {_ServerBodyApi, MemKey_ServerApi} from '../../main/index.js';
import {ensureBeLoggedTerminal} from '../ensure-belogged.js';
import {createTestServer} from './test-server.js';

function responseOrTimeout(pending: request.Test): request.Test | Promise<request.Response> {
	return Promise.race([
		pending,
		new Promise<never>((_resolve, reject) => {
			setTimeout(() => reject(new Error('response held by post-call')), 2_000);
		}),
	]);
}

async function waitUntil(ready: () => boolean): Promise<void> {
	const deadline = Date.now() + 1_000;
	while (!ready()) {
		if (Date.now() > deadline)
			throw new Error('post-call action did not reach the expected state');

		await new Promise(resolve => setTimeout(resolve, 10));
	}
}

describe('ServerApi post-call', () => {
	before(() => ensureBeLoggedTerminal());

	it('returns the response while the post-call action is still running', async function () {
		this.timeout(5_000);
		const server = createTestServer();
		await server.init();

		let release: () => void = () => undefined;
		const hold = new Promise<void>(resolve => {
			release = resolve;
		});
		let entered = false;

		server.addRoute(new _ServerBodyApi(
			{method: 'post', path: '/post-call'},
			async () => {
				MemKey_ServerApi.get().addPostCallAction(async () => {
					entered = true;
					await hold;
				});
				return {ok: true};
			},
		));

		try {
			const res = await responseOrTimeout(request(server.getExpress()).post('/post-call').send({}).expect(200));
			expect(res.body).to.deep.equal({ok: true});
			await waitUntil(() => entered);
		} finally {
			release();
		}
	});

	it('runs each parallel request on its own post-call list', async function () {
		this.timeout(5_000);
		const server = createTestServer();
		await server.init();

		const release: Record<string, () => void> = {};
		const started: string[] = [];
		const finished: string[] = [];

		server.addRoute(new _ServerBodyApi(
			{method: 'post', path: '/post-call-parallel'},
			async (body: {id: string}) => {
				MemKey_ServerApi.get().addPostCallAction(async () => {
					started.push(body.id);
					await new Promise<void>(resolve => {
						release[body.id] = resolve;
					});
					finished.push(body.id);
				});
				return {id: body.id};
			},
		));

		const send = (id: string) => responseOrTimeout(
			request(server.getExpress()).post('/post-call-parallel').send({id}).expect(200),
		);

		try {
			const [first, second] = await Promise.all([send('a'), send('b')]);
			expect(first.body).to.deep.equal({id: 'a'});
			expect(second.body).to.deep.equal({id: 'b'});
			await waitUntil(() => started.length === 2);
			expect(started.slice().sort()).to.deep.equal(['a', 'b']);
			expect(finished).to.deep.equal([]);

			release.a();
			await waitUntil(() => finished.length === 1);
			expect(finished).to.deep.equal(['a']);
			expect(started.filter(id => id === 'b')).to.have.length(1);

			release.b();
			await waitUntil(() => finished.length === 2);
			expect(finished).to.deep.equal(['a', 'b']);
		} finally {
			release.a?.();
			release.b?.();
		}
	});

	it('returns 200 when the post-call action throws', async function () {
		this.timeout(5_000);
		const server = createTestServer();
		await server.init();
		let failed = false;

		server.addRoute(new _ServerBodyApi(
			{method: 'post', path: '/post-call-error'},
			async () => {
				MemKey_ServerApi.get().addPostCallAction(async () => {
					failed = true;
					throw new Error('post-call failed');
				});
				return {ok: true};
			},
		));

		const res = await responseOrTimeout(request(server.getExpress()).post('/post-call-error').send({}).expect(200));
		expect(res.body).to.deep.equal({ok: true});
		await waitUntil(() => failed);
	});
});
