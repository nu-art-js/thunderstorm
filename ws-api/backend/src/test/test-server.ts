/*
 * @nu-art/ws-api-backend - WebSocket server module for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {execSync} from 'child_process';
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

export function createWsTestHttpServer(): HttpServer {
	return new HttpServer({...testServerConfig});
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
