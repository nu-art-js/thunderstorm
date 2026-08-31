/*
 * @nu-art/ws-api-backend - WebSocket server module for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createServer, type Server} from 'http';
import {execSync} from 'child_process';
import type {Express} from 'express';
import {HttpServer} from '@nu-art/http-server';

/** Fixed port for WS integration tests; must be free when tests run. */
export const WsTestPort = 39491;

const testServerConfig = {
	tag: 'ws-api-test',
	port: WsTestPort,
	baseUrl: '',
	cors: {headers: [] as string[], responseHeaders: [] as string[]},
	bodyParserLimit: 1024,
} as const;

/** HttpServer + getServer shim for WS attach until http-server publishes getServer(). */
export type WsTestHttpServer = HttpServer & {
	getServer(): Server;
	startServer(): Promise<void>;
	terminate(): Promise<void>;
};

export function createWsTestHttpServer(): WsTestHttpServer {
	const http = new HttpServer({...testServerConfig}) as WsTestHttpServer;
	let nodeServer: Server | undefined;

	http.getServer = () => {
		if (!nodeServer)
			nodeServer = createServer(http.getExpress() as Express);
		return nodeServer;
	};

	http.startServer = () => new Promise<void>((resolve, reject) => {
		const server = http.getServer();
		server.listen(WsTestPort);
		server.once('listening', () => resolve());
		server.once('error', reject);
	});

	http.terminate = () => new Promise<void>((resolve) => {
		const server = nodeServer;
		nodeServer = undefined;
		if (!server) {
			resolve();
			return;
		}
		server.close(() => resolve());
	});

	return http;
}

export function killProcessOnPort(port: number): void {
	try {
		const pids = execSync(`lsof -ti :${port}`, {encoding: 'utf8'}).trim();
		if (pids)
			execSync(`kill -9 ${pids}`);
	} catch {
		// no process on port
	}
}
