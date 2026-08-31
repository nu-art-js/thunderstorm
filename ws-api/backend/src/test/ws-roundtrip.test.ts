/*
 * @nu-art/ws-api-backend - WebSocket server module for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {WebSocket, type RawData} from 'ws';
import {BeLogged, LogClient_Terminal} from '@nu-art/ts-common';
import {encodeWsEnvelope, parseWsEnvelope, type WsEnvelope} from '@nu-art/ws-api-shared';
import {WsServer} from '../main/index.js';
import {createWsTestHttpServer, killProcessOnPort, WsTestPort} from './test-server.js';

declare global {
	var __wsApiBeLogged: boolean | undefined;
}

function ensureBeLogged(): void {
	if (globalThis.__wsApiBeLogged)
		return;
	BeLogged.addClient(LogClient_Terminal);
	globalThis.__wsApiBeLogged = true;
}

function waitOpen(ws: WebSocket): Promise<void> {
	return new Promise((resolve, reject) => {
		const onErr = (e: Error) => reject(e);
		ws.once('error', onErr);
		ws.once('open', () => {
			ws.off('error', onErr);
			resolve();
		});
	});
}

function rawToString(data: RawData): string {
	if (typeof data === 'string')
		return data;
	if (Buffer.isBuffer(data))
		return data.toString('utf8');
	return Buffer.from(data as ArrayBuffer).toString('utf8');
}

function waitMessage(ws: WebSocket, pred: (msg: WsEnvelope) => boolean, timeoutMs = 3000): Promise<WsEnvelope> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('timeout waiting for WS message')), timeoutMs);
		const onMessage = (data: RawData) => {
			const msg = parseWsEnvelope(rawToString(data));
			if (!msg || !pred(msg))
				return;
			clearTimeout(timer);
			ws.off('message', onMessage);
			resolve(msg);
		};
		ws.on('message', onMessage);
	});
}

describe('ws-api-backend connect → auth → ping/echo', () => {
	before(() => {
		ensureBeLogged();
		killProcessOnPort(WsTestPort);
	});

	it('rejects upgrade when authenticator returns false', async function () {
		this.timeout(10000);
		const http = createWsTestHttpServer().init();
		const wsServer = new WsServer().setAuthenticator(async () => false);
		wsServer.attach(http);
		await http.startServer();

		const client = new WebSocket(`ws://127.0.0.1:${WsTestPort}/ws?token=nope`);
		const closed = await new Promise<{ code?: number }>((resolve) => {
			client.once('unexpected-response', (_req, res) => {
				resolve({code: res.statusCode});
				res.resume();
				client.terminate();
			});
			client.once('open', () => {
				client.close();
				resolve({code: 200});
			});
			client.once('error', () => resolve({code: undefined}));
		});

		expect(closed.code).to.equal(401);
		await wsServer.close();
		await http.terminate();
	});

	it('connect → auth → ping → pong → echo → ack', async function () {
		this.timeout(15000);
		const http = createWsTestHttpServer().init();
		const wsServer = new WsServer().setAuthenticator(async ({url}) => {
			const token = url.searchParams.get('token');
			if (token !== 'ok')
				return false;
			return {accountId: 'acct-1', data: {token}};
		});
		wsServer.attach(http);
		await http.startServer();

		const client = new WebSocket(`ws://127.0.0.1:${WsTestPort}/ws?token=ok`);
		await waitOpen(client);

		const pongP = waitMessage(client, m => m.type === 'pong' && m.id === 'p1');
		client.send(encodeWsEnvelope({type: 'ping', id: 'p1', payload: {t: 42}}));
		const pong = await pongP;
		expect(pong.payload).to.deep.equal({t: 42});

		const echoP = waitMessage(client, m => m.type === 'echo' && m.id === 'e1');
		const ackP = waitMessage(client, m => m.type === 'ack' && m.id === 'e1');
		client.send(encodeWsEnvelope({type: 'echo', id: 'e1', payload: {hello: 'world'}}));
		const echo = await echoP;
		expect(echo.payload).to.deep.equal({hello: 'world'});
		const ack = await ackP;
		expect(ack.payload).to.deep.include({ok: true, forType: 'echo', forId: 'e1'});

		client.close();
		await wsServer.close();
		await http.terminate();
	});

	it('HTTP routes still respond after WS attach', async function () {
		this.timeout(10000);
		const http = createWsTestHttpServer().init();
		http.getExpress().get('/health', (_req, res) => {
			res.status(200).send('ok');
		});
		new WsServer().attach(http);
		await http.startServer();

		const res = await fetch(`http://127.0.0.1:${WsTestPort}/health`);
		expect(res.status).to.equal(200);
		expect(await res.text()).to.equal('ok');
		await http.terminate();
	});
});
