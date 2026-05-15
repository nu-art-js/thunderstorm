/*
 * @nu-art/mcp-backend - MCP Server backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {randomUUID} from 'node:crypto';
import {Logger} from '@nu-art/ts-common';
import {McpServer} from '@modelcontextprotocol/server';
import {NodeStreamableHTTPServerTransport} from '@modelcontextprotocol/node';
import type {CallToolResult} from '@modelcontextprotocol/server';
import type {ExpressRequest, ExpressResponse} from '@nu-art/http-server';
import type {McpServerInstanceConfig, McpToolContext} from '@nu-art/mcp-shared';
import type {McpToolRegistration, McpToolResult} from '@nu-art/mcp-shared';
import {z} from 'zod';

type ActiveTransport = {
	transport: NodeStreamableHTTPServerTransport;
	server: McpServer;
	createdAt: number;
};

export class McpServerInstance
	extends Logger {

	readonly config: McpServerInstanceConfig;
	private readonly transports = new Map<string, ActiveTransport>();
	private readonly toolRegistrations: McpToolRegistration[] = [];
	private cleanupInterval?: ReturnType<typeof setInterval>;

	constructor(config: McpServerInstanceConfig) {
		super(`McpServer_${config.name}`);
		this.config = config;
	}

	addTools(registrations: McpToolRegistration[]): void {
		this.toolRegistrations.push(...registrations);
	}

	start(): void {
		this.logInfo(`Starting MCP server instance '${this.config.name}' at ${this.config.pathPrefix}`);
		this.logInfo(`  ${this.toolRegistrations.length} tool(s) registered`);
		for (const reg of this.toolRegistrations) {
			this.logDebug(`  - ${reg.definition.name}`);
		}

		this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), 60_000);
	}

	async stop(): Promise<void> {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = undefined;
		}

		for (const [sessionId, entry] of this.transports) {
			this.logInfo(`Closing transport for session ${sessionId}`);
			await entry.transport.close();
		}
		this.transports.clear();
	}

	private createMcpServer(): McpServer {
		const server = new McpServer(
			{name: this.config.name, version: '1.0.0'},
			{
				capabilities: {logging: {}},
				...(this.config.instructions ? {instructions: this.config.instructions} : {}),
			}
		);

		for (const reg of this.toolRegistrations) {
			const def = reg.definition;
			const handler = reg.handler;
			const requiredScopes = def.requiredScopes ?? [];

			server.registerTool(
				def.name,
				{
					description: def.description,
					inputSchema: z.object({}).passthrough(),
					...(def.annotations ? {annotations: def.annotations} : {}),
				},
				async (input: Record<string, unknown>, ctx: any): Promise<CallToolResult> => {
					const authInfo = ctx?.http?.authInfo;
					if (requiredScopes.length > 0 && authInfo) {
						const userScopes: string[] = authInfo.scopes ?? [];
						const missingScopes = requiredScopes.filter(s => !userScopes.includes(s));
						if (missingScopes.length > 0) {
							return {
								content: [{type: 'text', text: `Permission denied: missing scopes [${missingScopes.join(', ')}]`}],
								isError: true,
							};
						}
					}

					const toolContext: McpToolContext = {
						authInfo: authInfo ? {
							clientId: authInfo.clientId,
							scopes: authInfo.scopes,
							expiresAt: authInfo.expiresAt,
							token: authInfo.token,
							extra: authInfo.extra,
						} : undefined,
						sessionId: ctx?.http?.sessionId,
						serverName: this.config.name,
					};

					const result: McpToolResult = await handler(input, toolContext);
					return {
						content: result.content.map(c => {
							if (c.type === 'text')
								return {type: 'text' as const, text: c.text};
							if (c.type === 'image')
								return {type: 'image' as const, data: c.data, mimeType: c.mimeType};
							return {type: 'text' as const, text: JSON.stringify(c)};
						}),
						...(result.structuredContent ? {structuredContent: result.structuredContent} : {}),
						...(result.isError ? {isError: true} : {}),
					};
				},
			);
		}

		return server;
	}

	private isInitializeRequest(body: any): boolean {
		return body?.method === 'initialize' && body?.jsonrpc === '2.0';
	}

	async handlePost(req: ExpressRequest, res: ExpressResponse): Promise<void> {
		const sessionId = req.headers['mcp-session-id'] as string | undefined;

		if (sessionId && this.transports.has(sessionId)) {
			const entry = this.transports.get(sessionId)!;
			await entry.transport.handleRequest(req, res, req.body);
			return;
		}

		if (!sessionId && this.isInitializeRequest(req.body)) {
			const transport = new NodeStreamableHTTPServerTransport({
				sessionIdGenerator: () => randomUUID(),
				onsessioninitialized: (newSessionId: string) => {
					this.logInfo(`Session initialized: ${newSessionId}`);
					this.transports.set(newSessionId, {transport, server, createdAt: Date.now()});
				},
			});

			transport.onclose = () => {
				const sid = transport.sessionId;
				if (sid && this.transports.has(sid)) {
					this.logInfo(`Transport closed for session ${sid}`);
					this.transports.delete(sid);
				}
			};

			const server = this.createMcpServer();
			await server.connect(transport);
			await transport.handleRequest(req, res, req.body);
			return;
		}

		if (sessionId) {
			res.status(404).json({
				jsonrpc: '2.0',
				error: {code: -32001, message: 'Session not found'},
				id: null,
			});
			return;
		}

		res.status(400).json({
			jsonrpc: '2.0',
			error: {code: -32000, message: 'Bad Request: no session ID and not an initialize request'},
			id: null,
		});
	}

	async handleGet(req: ExpressRequest, res: ExpressResponse): Promise<void> {
		const sessionId = req.headers['mcp-session-id'] as string | undefined;
		if (!sessionId) {
			res.status(400).send('Missing session ID');
			return;
		}

		const entry = this.transports.get(sessionId);
		if (!entry) {
			res.status(404).send('Session not found');
			return;
		}

		await entry.transport.handleRequest(req, res);
	}

	async handleDelete(req: ExpressRequest, res: ExpressResponse): Promise<void> {
		const sessionId = req.headers['mcp-session-id'] as string | undefined;
		if (!sessionId) {
			res.status(400).send('Missing session ID');
			return;
		}

		const entry = this.transports.get(sessionId);
		if (!entry) {
			res.status(404).send('Session not found');
			return;
		}

		this.logInfo(`Session termination requested: ${sessionId}`);
		await entry.transport.handleRequest(req, res);
	}

	private cleanupExpiredSessions(): void {
		const now = Date.now();
		for (const [sessionId, entry] of this.transports) {
			if (now - entry.createdAt > this.config.sessionTtlMs) {
				this.logInfo(`Expiring session ${sessionId} (age: ${Math.round((now - entry.createdAt) / 1000)}s)`);
				entry.transport.close().catch(err => this.logError(`Error closing expired session ${sessionId}:`, err));
				this.transports.delete(sessionId);
			}
		}
	}

	getActiveSessionCount(): number {
		return this.transports.size;
	}
}
