/*
 * @nu-art/ws-api-backend - WebSocket server module for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Server as HttpNodeServer, IncomingMessage} from 'http';
import type {Socket} from 'net';
import type {Duplex} from 'stream';
import {WebSocketServer, WebSocket, type RawData} from 'ws';
import {Logger} from '@nu-art/logger';
import {LogLevel} from '@nu-art/ts-common';
import {
	encodeWsEnvelope,
	parseWsEnvelope,
	wsAck,
	wsError,
	WsBuiltinType,
	type WsEnvelope,
} from '@nu-art/ws-api-shared';
import type {
	WsApiConfig,
	WsAuthenticator,
	WsConnectionAuth,
	WsHandlerContext,
	WsHeartbeatConfig,
	WsHttpAttachTarget,
	WsIdleResyncHandler,
	WsMessageHandler,
} from './types.js';
import {WsCloseCode_HeartbeatTimeout} from './types.js';

const DefaultPath = '/ws';
const HeartbeatBuiltinTypes = new Set<string>([WsBuiltinType.ping, WsBuiltinType.pong]);

type ConnectionTimers = {
	heartbeatInterval?: ReturnType<typeof setInterval>;
	idleTimeout?: ReturnType<typeof setTimeout>;
};

type ConnectionState = {
	socket: WebSocket;
	ctx: WsHandlerContext;
	lastLivenessAt: number;
	lastAppActivityAt: number;
	idlePending: boolean;
	timers: ConnectionTimers;
};

/**
 * Attaches a path-scoped WebSocketServer to an existing Node HTTP(S) server
 * (typically from HttpServer.getServer()). Does not own listen/terminate.
 */
export class WsServer
	extends Logger {

	private readonly handlers = new Map<string, WsMessageHandler>();
	private authenticator?: WsAuthenticator;
	private wss?: WebSocketServer;
	private path: string = DefaultPath;
	private attached = false;
	private heartbeat?: WsHeartbeatConfig;
	private idleMs?: number;
	private onIdleResync?: WsIdleResyncHandler;
	private readonly connections = new Set<ConnectionState>();

	constructor(config?: WsApiConfig) {
		super('ws-api');
		this.setMinLevel(LogLevel.Debug);
		this.applyConfig(config);
		this.registerBuiltinHandlers();
	}

	applyConfig(config?: WsApiConfig): this {
		this.path = config?.path ?? DefaultPath;
		this.heartbeat = config?.heartbeat;
		this.idleMs = config?.idleMs;
		this.onIdleResync = config?.onIdleResync;
		return this;
	}

	setPath(path: string): this {
		if (this.attached)
			throw new Error('WsServer: cannot change path after attach');
		this.path = path.startsWith('/') ? path : `/${path}`;
		return this;
	}

	setAuthenticator(authenticator: WsAuthenticator | undefined): this {
		this.authenticator = authenticator;
		return this;
	}

	setOnIdleResync(handler: WsIdleResyncHandler | undefined): this {
		this.onIdleResync = handler;
		return this;
	}

	registerHandler(type: string, handler: WsMessageHandler): this {
		if (this.handlers.has(type) && type !== WsBuiltinType.ping && type !== WsBuiltinType.echo)
			this.logWarning(`Overwriting WS handler for type '${type}'`);
		this.handlers.set(type, handler);
		return this;
	}

	/** Attach to HttpServer's Node server (creates it via getServer if needed). */
	attach(httpServer: WsHttpAttachTarget): this {
		return this.attachToNodeServer(httpServer.getServer());
	}

	attachToNodeServer(server: HttpNodeServer): this {
		if (this.attached)
			throw new Error('WsServer: already attached');

		this.wss = new WebSocketServer({noServer: true});
		this.wss.on('connection', (socket: WebSocket, req: IncomingMessage, auth: WsConnectionAuth) => {
			this.onConnection(socket, req, auth);
		});

		server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
			void this.handleUpgrade(req, socket, head);
		});

		this.attached = true;
		this.logInfo(`WS upgrade attached on path ${this.path}`);
		return this;
	}

	async close(): Promise<void> {
		for (const state of [...this.connections])
			this.teardownConnection(state);
		const wss = this.wss;
		this.wss = undefined;
		this.attached = false;
		if (!wss)
			return;
		await new Promise<void>((resolve) => wss.close(() => resolve()));
	}

	private registerBuiltinHandlers(): void {
		this.handlers.set(WsBuiltinType.ping, (msg, ctx) => {
			const t = (msg.payload as { t?: number } | undefined)?.t;
			ctx.send({type: WsBuiltinType.pong, id: msg.id, payload: {t}});
		});
		this.handlers.set(WsBuiltinType.echo, (msg, ctx) => {
			ctx.send({type: WsBuiltinType.echo, id: msg.id, payload: msg.payload});
			ctx.send(wsAck(msg));
		});
	}

	private async handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
		const url = this.resolveUrl(req);
		if (!url || url.pathname !== this.path) {
			// Not our path — leave the socket alone so other upgrade handlers can run.
			return;
		}

		let auth: WsConnectionAuth = {};
		if (this.authenticator) {
			try {
				const result = await this.authenticator({req, url});
				if (result === false) {
					socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
					socket.destroy();
					return;
				}
				auth = result;
			} catch (e) {
				this.logError('WS authenticator threw', e instanceof Error ? e : `${e}`);
				socket.write('HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n');
				socket.destroy();
				return;
			}
		}

		const wss = this.wss;
		if (!wss) {
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket as Socket, head, (ws: WebSocket) => {
			wss.emit('connection', ws, req, auth);
		});
	}

	private resolveUrl(req: IncomingMessage): URL | undefined {
		try {
			const host = req.headers.host ?? 'localhost';
			return new URL(req.url ?? '/', `http://${host}`);
		} catch {
			return undefined;
		}
	}

	private onConnection(socket: WebSocket, _req: IncomingMessage, auth: WsConnectionAuth): void {
		this.logDebug(`WS connected accountId=${auth.accountId ?? '-'}`);

		const ctx: WsHandlerContext = {
			auth,
			send: (msg) => {
				if (socket.readyState === WebSocket.OPEN)
					socket.send(encodeWsEnvelope(msg));
			},
			close: (code, reason) => socket.close(code, reason),
		};

		const now = Date.now();
		const state: ConnectionState = {
			socket,
			ctx,
			lastLivenessAt: now,
			lastAppActivityAt: now,
			idlePending: false,
			timers: {},
		};
		this.connections.add(state);

		socket.on('message', (data: RawData) => {
			void this.onMessage(data, state);
		});

		socket.on('close', () => this.teardownConnection(state));
		socket.on('error', (err: Error) => this.logError('WS socket error', err));

		this.startConnectionTimers(state);
	}

	private startConnectionTimers(state: ConnectionState): void {
		const hb = this.heartbeat;
		const pingIntervalMs = hb?.pingIntervalMs ?? 0;
		const pongTimeoutMs = this.resolvePongTimeoutMs(hb);
		const heartbeatEnabled = pingIntervalMs > 0 || pongTimeoutMs > 0;

		if (heartbeatEnabled) {
			const tickMs = pingIntervalMs > 0 ? pingIntervalMs : Math.max(250, Math.floor(pongTimeoutMs / 2));
			state.timers.heartbeatInterval = setInterval(() => this.onHeartbeatTick(state), tickMs);
		}

		if (this.idleMs && this.idleMs > 0 && this.onIdleResync)
			this.scheduleIdleCheck(state);
	}

	private resolvePongTimeoutMs(hb?: WsHeartbeatConfig): number {
		if (hb?.pongTimeoutMs && hb.pongTimeoutMs > 0)
			return hb.pongTimeoutMs;
		if (hb?.pingIntervalMs && hb.pingIntervalMs > 0)
			return hb.pingIntervalMs * 2;
		return 0;
	}

	private onHeartbeatTick(state: ConnectionState): void {
		if (state.socket.readyState !== WebSocket.OPEN)
			return;

		const hb = this.heartbeat;
		const pongTimeoutMs = this.resolvePongTimeoutMs(hb);
		if (pongTimeoutMs > 0 && Date.now() - state.lastLivenessAt > pongTimeoutMs) {
			this.logDebug(`WS heartbeat timeout accountId=${state.ctx.auth.accountId ?? '-'}`);
			state.ctx.close(WsCloseCode_HeartbeatTimeout, 'heartbeat timeout');
			return;
		}

		const pingIntervalMs = hb?.pingIntervalMs ?? 0;
		if (pingIntervalMs > 0)
			state.ctx.send({type: WsBuiltinType.ping, payload: {t: Date.now()}});
	}

	private scheduleIdleCheck(state: ConnectionState): void {
		const idleMs = this.idleMs;
		if (!idleMs || idleMs <= 0 || !this.onIdleResync)
			return;

		if (state.timers.idleTimeout)
			clearTimeout(state.timers.idleTimeout);

		state.timers.idleTimeout = setTimeout(() => {
			void this.onIdleTimeout(state);
		}, idleMs);
	}

	private async onIdleTimeout(state: ConnectionState): Promise<void> {
		if (state.socket.readyState !== WebSocket.OPEN)
			return;

		const idleMs = this.idleMs;
		if (!idleMs || !this.onIdleResync)
			return;

		const silentForMs = Date.now() - state.lastAppActivityAt;
		if (silentForMs < idleMs) {
			this.scheduleIdleCheck(state);
			return;
		}

		if (state.idlePending)
			return;

		state.idlePending = true;
		try {
			await this.onIdleResync(state.ctx);
		} catch (e) {
			this.logError('WS onIdleResync failed', e instanceof Error ? e : `${e}`);
		} finally {
			state.idlePending = false;
			this.scheduleIdleCheck(state);
		}
	}

	private touchLiveness(state: ConnectionState, msg: WsEnvelope): void {
		const acceptClientPing = this.heartbeat?.acceptClientPing !== false;
		const isBuiltinHeartbeat = HeartbeatBuiltinTypes.has(msg.type);
		if (!isBuiltinHeartbeat || acceptClientPing)
			state.lastLivenessAt = Date.now();

		if (!isBuiltinHeartbeat)
			state.lastAppActivityAt = Date.now();
	}

	private teardownConnection(state: ConnectionState): void {
		this.connections.delete(state);
		if (state.timers.heartbeatInterval)
			clearInterval(state.timers.heartbeatInterval);
		if (state.timers.idleTimeout)
			clearTimeout(state.timers.idleTimeout);
		state.timers = {};
	}

	private async onMessage(data: RawData, state: ConnectionState): Promise<void> {
		const raw = typeof data === 'string' ? data : Buffer.isBuffer(data) ? data.toString('utf8') : Buffer.from(data as ArrayBuffer).toString('utf8');
		const msg = parseWsEnvelope(raw);
		if (!msg) {
			state.ctx.send(wsError('invalid envelope'));
			return;
		}

		this.touchLiveness(state, msg);
		if (!HeartbeatBuiltinTypes.has(msg.type))
			this.scheduleIdleCheck(state);

		const handler = this.handlers.get(msg.type);
		if (!handler) {
			state.ctx.send(wsError(`unknown type: ${msg.type}`, msg));
			return;
		}

		try {
			await handler(msg, state.ctx);
		} catch (e) {
			this.logError(`WS handler '${msg.type}' failed`, e instanceof Error ? e : `${e}`);
			state.ctx.send(wsError(e instanceof Error ? e.message : 'handler failed', msg));
		}
	}
}
