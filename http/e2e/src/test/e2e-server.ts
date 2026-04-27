/*
 * @nu-art/http-e2e-tests - E2E tests for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {execSync} from 'child_process';
import {HttpServer, _ServerBodyApi, _ServerQueryApi} from '@nu-art/http-server';
import {ApiCaller, ApiCallback, ApiDef, GeneralApi, HttpClient} from '@nu-art/http-client';

export const E2EPort = 39483;
export const origin = `http://127.0.0.1:${E2EPort}`;

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

/**
 * Creates a fresh server, registers routes via setup(), starts it, runs test(), then terminates.
 * Guarantees terminate() even if the test throws.
 */
export async function withServer<T>(
	setup: (server: HttpServer) => void,
	test: (client: HttpClient) => Promise<T>
): Promise<T> {
	const server = createE2EServer();
	await server.init();
	setup(server);
	await server.startServer();
	try {
		return await test(new HttpClient({origin}));
	} finally {
		await server.terminate();
	}
}

/** Registers a GET/DELETE route handler directly (no decorator boilerplate). */
export function queryRoute(server: HttpServer, apiDef: ApiDef<any>, handler: (params: any) => Promise<any>): void {
	server.addRoute(new _ServerQueryApi(apiDef, handler));
}

/** Registers a POST/PUT/PATCH route handler directly (no decorator boilerplate). */
export function bodyRoute(server: HttpServer, apiDef: ApiDef<any>, handler: (body: any) => Promise<any>): void {
	server.addRoute(new _ServerBodyApi(apiDef, handler));
}

/**
 * Generic typed proxy that uses @ApiCaller under the hood.
 * Lets E2E tests call any API through the same decorator path real consumers use,
 * without writing a dedicated service class per test.
 */
export class ApiProxy<API extends GeneralApi> {
	constructor(readonly apiDef: ApiDef<API>, readonly httpClient: HttpClient) {}

	@ApiCaller((self: any) => self.apiDef, {httpClient: (self: any) => self.httpClient})
	async call(_payload: API['P'] | API['B'], _callback?: ApiCallback<API>): Promise<API['R']> { return undefined!; }
}
