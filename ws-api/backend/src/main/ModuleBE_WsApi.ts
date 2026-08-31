/*
 * @nu-art/ws-api-backend - WebSocket server module for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {WsServer} from './WsServer.js';
import type {WsApiConfig, WsAuthenticator, WsIdleResyncHandler, WsMessageHandler, WsHttpAttachTarget} from './types.js';

/**
 * Storm module façade over {@link WsServer}.
 * Register handlers / authenticator any time; call {@link attach} once against the app HttpServer.
 */
export class ModuleBE_WsApi_Class
	extends Module<WsApiConfig> {

	private readonly wsServer: WsServer;

	constructor() {
		super();
		this.wsServer = new WsServer();
	}

	protected init(): void {
		super.init();
		this.wsServer.applyConfig(this.config);
	}

	setAuthenticator(authenticator: WsAuthenticator | undefined): this {
		this.wsServer.setAuthenticator(authenticator);
		return this;
	}

	registerHandler(type: string, handler: WsMessageHandler): this {
		this.wsServer.registerHandler(type, handler);
		return this;
	}

	setOnIdleResync(handler: WsIdleResyncHandler | undefined): this {
		this.wsServer.setOnIdleResync(handler);
		return this;
	}

	/** Attach upgrade handler to HttpServer's Node server. Safe to call before or after startServer. */
	attach(httpServer: WsHttpAttachTarget): this {
		this.wsServer.attach(httpServer);
		return this;
	}

	getServer(): WsServer {
		return this.wsServer;
	}

	async close(): Promise<void> {
		await this.wsServer.close();
	}
}

export const ModuleBE_WsApi = new ModuleBE_WsApi_Class();
