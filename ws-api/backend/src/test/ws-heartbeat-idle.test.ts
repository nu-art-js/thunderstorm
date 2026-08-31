/*
 * @nu-art/ws-api-backend - WebSocket server module for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {WebSocket, type RawData} from 'ws';
import {BeLogged, LogClient_Terminal} from '@nu-art/ts-common';
import {encodeWsEnvelope, parseWsEnvelope, WsBuiltinType, type WsEnvelope} from '@nu-art/ws-api-shared';
import {WsServer, WsCloseCode_HeartbeatTimeout} from '../../dist/index.js';
import {createWsTestHttpServer, killProcessOnPort, WsTestPort} from './test-server.js';

declare global {
	var __wsApiHeartbeatBeLogged: boolean | undefined;
}

function ensureBeLogged(): void {
	if (globalThis.__wsApiHeartbeatBeLogged)
		return;
	BeLogged.addClient(LogClient_Terminal);
	globalThis.__wsApiHeartbeatBeLogged = true;
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

function waitClose(ws: WebSocket, timeoutMs = 3000): Promise<{ code: number; reason: Buffer }> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('timeout waiting for WS close')), timeoutMs);
		ws.once('close', (code, reason) => {
			clearTimeout(timer);
			resolve({code, reason});
		});
	});
}

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/** Auto-respond to server ping envelopes so the connection stays alive. */
function attachAutoPong(client: WebSocket): void {
	client.on('message', (data: RawData) => {
		const msg = parseWsEnvelope(rawToString(data));
		if (!msg || msg.type !== WsBuiltinType.ping)
			return;
		client.send(encodeWsEnvelope({type: WsBuiltinType.pong, id: msg.id, payload: msg.payload}));
	});
}

describe('ws-api-backend heartbeat + idle resync', () => {
	before(() => {
		ensureBeLogged();
		killProcessOnPort(WsTestPort);
	});

	it('server heartbeat ping + client pong keeps connection open', async function () {
		this.timeout(10000);
		const http = createWsTestHttpServer().init();
		const wsServer = new WsServer({
			heartbeat: {pingIntervalMs: 150, pongTimeoutMs: 600},
		});
		wsServer.attach(http);
		await http.startServer();

		const client = new WebSocket(`ws://127.0.0.1:${WsTestPort}/ws`);
		await waitOpen(client);
		attachAutoPong(client);

		await waitMessage(client, m => m.type === WsBuiltinType.ping, 1000);
		await delay(450);
		expect(client.readyState).to.equal(WebSocket.OPEN);

		client.close();
		await wsServer.close();
		await http.terminate();
	});

	it('missed heartbeat closes the connection', async function () {
		this.timeout(10000);
		const http = createWsTestHttpServer().init();
		const wsServer = new WsServer({
			heartbeat: {pingIntervalMs: 100, pongTimeoutMs: 250},
		});
		wsServer.attach(http);
		await http.startServer();

		const client = new WebSocket(`ws://127.0.0.1:${WsTestPort}/ws`);
		await waitOpen(client);
		// Do not respond to server pings.

		const closed = await waitClose(client, 2000);
		expect(closed.code).to.equal(WsCloseCode_HeartbeatTimeout);

		await wsServer.close();
		await http.terminate();
	});

	it('client ping counts as liveness when acceptClientPing is enabled', async function () {
		this.timeout(10000);
		const http = createWsTestHttpServer().init();
		const wsServer = new WsServer({
			heartbeat: {pingIntervalMs: 0, pongTimeoutMs: 400, acceptClientPing: true},
		});
		wsServer.attach(http);
		await http.startServer();

		const client = new WebSocket(`ws://127.0.0.1:${WsTestPort}/ws`);
		await waitOpen(client);

		const tick = setInterval(() => {
			if (client.readyState === WebSocket.OPEN)
				client.send(encodeWsEnvelope({type: WsBuiltinType.ping, id: `hb-${Date.now()}`}));
		}, 120);

		await delay(550);
		clearInterval(tick);
		expect(client.readyState).to.equal(WebSocket.OPEN);

		client.close();
		await wsServer.close();
		await http.terminate();
	});

	it('onIdleResync fires after app silence (builtins excluded)', async function () {
		this.timeout(10000);
		const http = createWsTestHttpServer().init();
		let idleCalls = 0;
		const wsServer = new WsServer({
			heartbeat: {pingIntervalMs: 0, pongTimeoutMs: 30_000},
			idleMs: 250,
			onIdleResync: () => {
				idleCalls++;
			},
		});
		wsServer.attach(http);
		await http.startServer();

		const client = new WebSocket(`ws://127.0.0.1:${WsTestPort}/ws`);
		await waitOpen(client);
		attachAutoPong(client);

		await delay(400);
		expect(idleCalls).to.be.greaterThan(0);
		const callsAfterIdle = idleCalls;

		client.send(encodeWsEnvelope({type: 'echo', id: 'app-1', payload: {n: 1}}));
		await waitMessage(client, m => m.type === WsBuiltinType.ack && m.id === 'app-1', 1000);

		await delay(400);
		expect(idleCalls).to.be.greaterThan(callsAfterIdle);

		client.close();
		await wsServer.close();
		await http.terminate();
	});
});
