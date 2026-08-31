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
import type {HttpServer} from '@nu-art/http-server';
import {
	encodeWsEnvelope,
	parseWsEnvelope,
	wsAck,
	wsError,
	WsBuiltinType,
} from '@nu-art/ws-api-shared';
import type {
	WsApiConfig,
	WsAuthenticator,
	WsConnectionAuth,
	WsHandlerContext,
	WsMessageHandler,
} from './types.js';

const DefaultPath = '/ws';

/**
 * Attaches a path-scoped WebSocketServer to an existing Node HTTP(S) server
 * (typically from HttpServer.getServer()). Does not own listen/terminate.
 */
export class WsServer
	extends Logger {

	private readonly handlers = new Map<string, WsMessageHandler>();
	private authenticator?: WsAuthenticator;
	private wss?: WebSocketServer;
	private path: string;
	private attached = false;

	constructor(config?: WsApiConfig) {
		super('ws-api');
		this.setMinLevel(LogLevel.Debug);
		this.path = config?.path ?? DefaultPath;
		this.registerBuiltinHandlers();
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

	registerHandler(type: string, handler: WsMessageHandler): this {
		if (this.handlers.has(type) && type !== WsBuiltinType.ping && type !== WsBuiltinType.echo)
			this.logWarning(`Overwriting WS handler for type '${type}'`);
		this.handlers.set(type, handler);
		return this;
	}

	/** Attach to HttpServer's Node server (creates it via getServer if needed). */
	attach(httpServer: HttpServer): this {
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

		socket.on('message', (data: RawData) => {
			void this.onMessage(data, ctx);
		});

		socket.on('error', (err: Error) => this.logError('WS socket error', err));
	}

	private async onMessage(data: RawData, ctx: WsHandlerContext): Promise<void> {
		const raw = typeof data === 'string' ? data : Buffer.isBuffer(data) ? data.toString('utf8') : Buffer.from(data as ArrayBuffer).toString('utf8');
		const msg = parseWsEnvelope(raw);
		if (!msg) {
			ctx.send(wsError('invalid envelope'));
			return;
		}

		const handler = this.handlers.get(msg.type);
		if (!handler) {
			ctx.send(wsError(`unknown type: ${msg.type}`, msg));
			return;
		}

		try {
			await handler(msg, ctx);
		} catch (e) {
			this.logError(`WS handler '${msg.type}' failed`, e instanceof Error ? e : `${e}`);
			ctx.send(wsError(e instanceof Error ? e.message : 'handler failed', msg));
		}
	}
}
