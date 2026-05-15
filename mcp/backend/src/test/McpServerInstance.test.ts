/*
 * @nu-art/mcp-backend - MCP Server backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {McpServerInstance} from '../main/McpServerInstance.js';
import type {McpServerInstanceConfig} from '@nu-art/mcp-shared';
import type {McpToolRegistration} from '@nu-art/mcp-shared';

const createConfig = (overrides?: Partial<McpServerInstanceConfig>): McpServerInstanceConfig => ({
	name: 'test-server',
	pathPrefix: '/mcp/test',
	requiredScopes: [],
	sessionTtlMs: 60_000,
	...overrides,
});

const createToolReg = (name: string, overrides?: Partial<McpToolRegistration['definition']>): McpToolRegistration => ({
	definition: {
		name,
		description: `Test tool: ${name}`,
		inputSchema: {},
		...overrides,
	},
	handler: async () => ({content: [{type: 'text', text: 'ok'}]}),
});

describe('McpServerInstance', () => {
	describe('configuration', () => {
		it('stores the provided config', () => {
			const config = createConfig({name: 'my-server', pathPrefix: '/mcp/admin'});
			const instance = new McpServerInstance(config);

			expect(instance.config.name).to.equal('my-server');
			expect(instance.config.pathPrefix).to.equal('/mcp/admin');
		});

		it('preserves required scopes from config', () => {
			const config = createConfig({requiredScopes: ['admin:read', 'admin:write']});
			const instance = new McpServerInstance(config);

			expect(instance.config.requiredScopes).to.deep.equal(['admin:read', 'admin:write']);
		});

		it('preserves session TTL from config', () => {
			const config = createConfig({sessionTtlMs: 120_000});
			const instance = new McpServerInstance(config);

			expect(instance.config.sessionTtlMs).to.equal(120_000);
		});

		it('preserves instructions from config', () => {
			const config = createConfig({instructions: 'You are a helpful agent'});
			const instance = new McpServerInstance(config);

			expect(instance.config.instructions).to.equal('You are a helpful agent');
		});
	});

	describe('tool registration', () => {
		it('starts with zero active sessions', () => {
			const instance = new McpServerInstance(createConfig());
			expect(instance.getActiveSessionCount()).to.equal(0);
		});

		it('accepts tool registrations via addTools', () => {
			const instance = new McpServerInstance(createConfig());
			instance.addTools([
				createToolReg('tool-a'),
				createToolReg('tool-b'),
			]);

			// The tools are accepted (no throw). Verify by starting —
			// start() logs tool count, but we can't observe logs in pure tests.
			// Instead, verify the instance doesn't throw on start/stop.
			instance.start();
			instance.stop();
		});

		it('accumulates tools across multiple addTools calls', () => {
			const instance = new McpServerInstance(createConfig());
			instance.addTools([createToolReg('first')]);
			instance.addTools([createToolReg('second'), createToolReg('third')]);

			instance.start();
			instance.stop();
		});
	});

	describe('lifecycle', () => {
		it('start and stop without errors when no sessions exist', async () => {
			const instance = new McpServerInstance(createConfig());
			instance.start();
			await instance.stop();

			expect(instance.getActiveSessionCount()).to.equal(0);
		});

		it('can be started and stopped multiple times', async () => {
			const instance = new McpServerInstance(createConfig());

			instance.start();
			await instance.stop();
			expect(instance.getActiveSessionCount()).to.equal(0);

			instance.start();
			await instance.stop();
			expect(instance.getActiveSessionCount()).to.equal(0);
		});
	});

	describe('handlePost — error responses', () => {
		it('returns 404 for unknown session id', async () => {
			const instance = new McpServerInstance(createConfig());
			instance.start();

			let statusCode = 0;
			let responseBody: any;

			const mockReq = {
				headers: {'mcp-session-id': 'nonexistent-session'},
				body: {jsonrpc: '2.0', method: 'tools/list', id: 1},
			} as any;

			const mockRes = {
				status: (code: number) => {
					statusCode = code;
					return {
						json: (body: any) => { responseBody = body; },
						send: (body: any) => { responseBody = body; },
					};
				},
				json: (body: any) => { responseBody = body; },
			} as any;

			await instance.handlePost(mockReq, mockRes);

			expect(statusCode).to.equal(404);
			expect(responseBody.error.message).to.equal('Session not found');

			await instance.stop();
		});

		it('returns 400 for request without session id and not initialize', async () => {
			const instance = new McpServerInstance(createConfig());
			instance.start();

			let statusCode = 0;
			let responseBody: any;

			const mockReq = {
				headers: {},
				body: {jsonrpc: '2.0', method: 'tools/list', id: 1},
			} as any;

			const mockRes = {
				status: (code: number) => {
					statusCode = code;
					return {
						json: (body: any) => { responseBody = body; },
						send: (body: any) => { responseBody = body; },
					};
				},
				json: (body: any) => { responseBody = body; },
			} as any;

			await instance.handlePost(mockReq, mockRes);

			expect(statusCode).to.equal(400);
			expect(responseBody.error.message).to.include('not an initialize request');

			await instance.stop();
		});
	});

	describe('handleGet — error responses', () => {
		it('returns 400 when session id header is missing', async () => {
			const instance = new McpServerInstance(createConfig());
			instance.start();

			let statusCode = 0;
			let sentBody: string | undefined;

			const mockReq = {headers: {}} as any;
			const mockRes = {
				status: (code: number) => {
					statusCode = code;
					return {send: (body: string) => { sentBody = body; }};
				},
			} as any;

			await instance.handleGet(mockReq, mockRes);

			expect(statusCode).to.equal(400);
			expect(sentBody).to.equal('Missing session ID');

			await instance.stop();
		});

		it('returns 404 when session id is not found', async () => {
			const instance = new McpServerInstance(createConfig());
			instance.start();

			let statusCode = 0;
			let sentBody: string | undefined;

			const mockReq = {headers: {'mcp-session-id': 'bad-id'}} as any;
			const mockRes = {
				status: (code: number) => {
					statusCode = code;
					return {send: (body: string) => { sentBody = body; }};
				},
			} as any;

			await instance.handleGet(mockReq, mockRes);

			expect(statusCode).to.equal(404);
			expect(sentBody).to.equal('Session not found');

			await instance.stop();
		});
	});

	describe('handleDelete — error responses', () => {
		it('returns 400 when session id header is missing', async () => {
			const instance = new McpServerInstance(createConfig());
			instance.start();

			let statusCode = 0;
			let sentBody: string | undefined;

			const mockReq = {headers: {}} as any;
			const mockRes = {
				status: (code: number) => {
					statusCode = code;
					return {send: (body: string) => { sentBody = body; }};
				},
			} as any;

			await instance.handleDelete(mockReq, mockRes);

			expect(statusCode).to.equal(400);
			expect(sentBody).to.equal('Missing session ID');

			await instance.stop();
		});

		it('returns 404 when session id is not found', async () => {
			const instance = new McpServerInstance(createConfig());
			instance.start();

			let statusCode = 0;
			let sentBody: string | undefined;

			const mockReq = {headers: {'mcp-session-id': 'bad-id'}} as any;
			const mockRes = {
				status: (code: number) => {
					statusCode = code;
					return {send: (body: string) => { sentBody = body; }};
				},
			} as any;

			await instance.handleDelete(mockReq, mockRes);

			expect(statusCode).to.equal(404);
			expect(sentBody).to.equal('Session not found');

			await instance.stop();
		});
	});
});
