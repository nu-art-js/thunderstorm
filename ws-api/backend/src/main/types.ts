/*
 * @nu-art/ws-api-backend - WebSocket server module for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {IncomingMessage} from 'http';
import type {WsEnvelope} from '@nu-art/ws-api-shared';

/** Opaque connection identity produced by the app authenticator. */
export type WsConnectionAuth = {
	accountId?: string;
	data?: Record<string, unknown>;
};

export type WsAuthenticateContext = {
	req: IncomingMessage;
	url: URL;
};

/**
 * Upgrade-time auth hook.
 * - Return auth object to accept.
 * - Return `false` to reject (HTTP 401 on upgrade).
 * - If unset, connections are accepted with empty auth.
 */
export type WsAuthenticator = (ctx: WsAuthenticateContext) => Promise<WsConnectionAuth | false>;

export type WsHandlerContext = {
	auth: WsConnectionAuth;
	send: (msg: WsEnvelope) => void;
	close: (code?: number, reason?: string) => void;
};

export type WsMessageHandler = (msg: WsEnvelope, ctx: WsHandlerContext) => void | Promise<void>;

export type WsApiConfig = {
	/** Upgrade path on the shared HttpServer. Default `/ws`. */
	path?: string;
};
