/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {execSync} from 'child_process';
import {HttpServer} from '../../main/index.js';

/** Fixed port for integration tests; must be free when tests run. */
export const TestPort = 39482;

/** Single canonical test server config. Use createTestServer() in every test; start then terminate for isolation. */
const testServerConfig = {
	tag: 'test',
	port: TestPort,
	baseUrl: '',
	cors: {headers: [] as string[], responseHeaders: [] as string[]},
} as const;

/** Creates a new HttpServer with the shared test config. Call init(), register routes, startServer(), then terminate() in each test. */
export function createTestServer(): HttpServer {
	return new HttpServer({...testServerConfig});
}

/** Kills any process listening on the given port (Unix/darwin: lsof + kill). Call in before() to clear stale processes. */
export function killProcessOnPort(port: number): void {
	try {
		const pids = execSync(`lsof -ti :${port}`, {encoding: 'utf8'}).trim();
		if (pids)
			execSync(`kill -9 ${pids}`);
	} catch {
		// lsof exits non-zero when no process found; ignore
	}
}
