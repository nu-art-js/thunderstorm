/*
 * @nu-art/mcp-backend - MCP Server backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Dispatcher, Module} from '@nu-art/ts-common';
import {HttpServer} from '@nu-art/http-server';
import type {McpServerInstanceConfig} from '@nu-art/mcp-shared';
import type {McpToolProvider} from '@nu-art/mcp-shared';
import {McpToolRegistryImpl} from './McpToolRegistryImpl.js';
import {McpServerInstance} from './McpServerInstance.js';
import {AgentToolBridge} from './AgentToolBridge.js';

export type McpTokenVerifier = {
	verifyAccessToken: (token: string) => Promise<{
		clientId: string;
		scopes: string[];
		expiresAt?: number;
		token: string;
		extra?: Record<string, unknown>;
	}>;
};

export type Config = {
	servers: McpServerInstanceConfig[];
	authServerUrl?: string;
	bridgeLegacyTools?: boolean;
};

const DefaultConfig: Config = {
	servers: [{
		name: 'default',
		pathPrefix: '/mcp',
		requiredScopes: [],
		sessionTtlMs: 3_600_000,
	}],
	bridgeLegacyTools: true,
};

const dispatcher_McpToolProvider = new Dispatcher<McpToolProvider, 'registerMcpTools'>('registerMcpTools');

export class ModuleBE_McpServer_Class
	extends Module<Config> {

	private readonly instances = new Map<string, McpServerInstance>();
	private tokenVerifier?: McpTokenVerifier;

	constructor() {
		super();
		this.setDefaultConfig(DefaultConfig);
	}

	setTokenVerifier(verifier: McpTokenVerifier): this {
		this.tokenVerifier = verifier;
		return this;
	}

	protected init(): void {
		const registry = new McpToolRegistryImpl();
		dispatcher_McpToolProvider.dispatchModule(registry);
		const allRegistrations = registry.getRegistrations();

		if (this.config.bridgeLegacyTools) {
			const bridge = new AgentToolBridge();
			const bridged = bridge.bridgeAll();
			allRegistrations.push(...bridged);
		}

		this.logInfo(`Collected ${allRegistrations.length} MCP tool(s) from modules`);

		for (const serverConfig of this.config.servers) {
			const instance = new McpServerInstance(serverConfig);

			const targetedTools = allRegistrations.filter(reg => {
				const target = reg.definition.serverTarget ?? 'default';
				return target === serverConfig.name;
			});

			instance.addTools(targetedTools);
			this.instances.set(serverConfig.name, instance);
		}

		const unrouted = allRegistrations.filter(reg => {
			const target = reg.definition.serverTarget ?? 'default';
			return !this.instances.has(target);
		});

		if (unrouted.length > 0) {
			this.logWarningBold(`${unrouted.length} tool(s) target unknown MCP server instances:`);
			for (const reg of unrouted) {
				this.logWarning(`  - ${reg.definition.name} → ${reg.definition.serverTarget}`);
			}
		}

		this.mountRoutes();

		for (const instance of this.instances.values()) {
			instance.start();
		}
	}

	private mountRoutes(): void {
		const express = HttpServer.getDefault().getExpress();

		for (const instance of this.instances.values()) {
			const prefix = instance.config.pathPrefix;
			this.logInfo(`Mounting MCP routes at ${prefix}`);

			if (this.tokenVerifier) {
				const verifier = this.tokenVerifier;
				const requiredScopes = instance.config.requiredScopes;

				const authMiddleware = async (req: any, res: any, next: any) => {
					const authHeader = req.headers['authorization'] as string | undefined;
					if (!authHeader?.startsWith('Bearer ')) {
						res.status(401).json({
							error: 'invalid_token',
							error_description: 'Missing or invalid Authorization header',
						});
						return;
					}

					const token = authHeader.substring(7);
					try {
						const authInfo = await verifier.verifyAccessToken(token);

						if (authInfo.expiresAt && authInfo.expiresAt < Math.floor(Date.now() / 1000)) {
							res.status(401).json({
								error: 'invalid_token',
								error_description: 'Token has expired',
							});
							return;
						}

						if (requiredScopes.length > 0) {
							const missing = requiredScopes.filter(s => !authInfo.scopes.includes(s));
							if (missing.length > 0) {
								res.status(403).json({
									error: 'insufficient_scope',
									error_description: `Missing required scopes: ${missing.join(', ')}`,
								});
								return;
							}
						}

						req.auth = authInfo;
						next();
					} catch (err: any) {
						this.logError(`Token verification failed:`, err);
						res.status(401).json({
							error: 'invalid_token',
							error_description: err.message || 'Token verification failed',
						});
					}
				};

				express.post(prefix, authMiddleware, (req, res) => instance.handlePost(req, res));
				express.get(prefix, authMiddleware, (req, res) => instance.handleGet(req, res));
				express.delete(prefix, authMiddleware, (req, res) => instance.handleDelete(req, res));
			} else {
				express.post(prefix, (req, res) => instance.handlePost(req, res));
				express.get(prefix, (req, res) => instance.handleGet(req, res));
				express.delete(prefix, (req, res) => instance.handleDelete(req, res));
			}

			if (this.config.authServerUrl) {
				const metadataPath = `/.well-known/oauth-protected-resource`;
				express.get(metadataPath, (_req, res) => {
					res.json({
						resource: `${this.config.authServerUrl}${prefix}`,
						authorization_servers: [this.config.authServerUrl],
						scopes_supported: instance.config.requiredScopes,
					});
				});
				this.logInfo(`  Protected Resource Metadata at ${metadataPath}`);
			}
		}
	}

	getInstance(name: string): McpServerInstance | undefined {
		return this.instances.get(name);
	}

	getInstances(): McpServerInstance[] {
		return Array.from(this.instances.values());
	}
}

export const ModuleBE_McpServer = new ModuleBE_McpServer_Class();
