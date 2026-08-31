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

/** Infra heartbeat — detects dead connections; not app gameplay traffic. */
export type WsHeartbeatConfig = {
	/** How often the server sends `ping` envelopes. 0 / unset = server does not ping (client ping still accepted). */
	pingIntervalMs?: number;
	/** Close when no inbound liveness within this window. Defaults to `pingIntervalMs * 2` when server pings. */
	pongTimeoutMs?: number;
	/** Treat inbound client `ping` / `pong` as liveness. Default true. */
	acceptClientPing?: boolean;
};

/** App hook: connection had no app-level traffic for {@link WsApiConfig.idleMs}. */
export type WsIdleResyncHandler = (ctx: WsHandlerContext) => void | Promise<void>;

/** Minimal HttpServer surface for WS upgrade attach. */
export type WsHttpAttachTarget = {
	getServer(): import('http').Server;
};

export type WsApiConfig = {
	/** Upgrade path on the shared HttpServer. Default `/ws`. */
	path?: string;
	/** Infra heartbeat options. Omit to disable server-side heartbeat monitoring. */
	heartbeat?: WsHeartbeatConfig;
	/** Fire {@link onIdleResync} after this many ms without app messages (builtins excluded). */
	idleMs?: number;
	/** Called once per idle period so the app can push a full-state snapshot. */
	onIdleResync?: WsIdleResyncHandler;
};

/** WebSocket close code when heartbeat times out. */
export const WsCloseCode_HeartbeatTimeout = 4001;
