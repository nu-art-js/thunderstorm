/*
 * @nu-art/db-api-e2e-tests - E2E tests for db-api
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {execSync} from 'child_process';
import {HttpServer} from '@nu-art/http-server';

/** Fixed port for E2E tests; distinct from http/server (39482) and http-e2e (39483). */
export const E2EPort = 39484;

const e2eServerConfig = {
	tag: 'e2e-test',
	port: E2EPort,
	baseUrl: '',
	cors: {headers: [] as string[], responseHeaders: [] as string[]},
	bodyParserLimit: 1024,
} as const;

/** Creates a new HttpServer for E2E. Call init(), register routes, startServer(), then terminate() in each test. */
export function createE2EServer(): HttpServer {
	return new HttpServer({...e2eServerConfig});
}

/** Kills any process listening on the given port (Unix/darwin: lsof + kill). Call in beforeEach() to clear stale processes. */
export function killProcessOnPort(port: number): void {
	try {
		const pids = execSync(`lsof -ti :${port}`, {encoding: 'utf8'}).trim();
		if (pids)
			execSync(`kill -9 ${pids}`);
	} catch {
		// lsof exits non-zero when no process found; ignore
	}
}
