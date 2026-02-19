/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createServer as createHttpServer, Server} from 'http';
import {createServer as createHttpsServer} from 'https';
import type {Socket} from 'net';
import * as fs from 'fs';
import {addItemToArray, LogLevel} from '@nu-art/ts-common';
import express from 'express';
import type {Express, ExpressRequest, ExpressRequestHandler, ExpressResponse, ExpressRouter} from './types.js';
import {ServerApi} from './ServerApi.js';
import compression from 'compression';
import cors from 'cors';
import {Logger} from '@nu-art/logger';

const ALL_Methods: string[] = ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'];
const DefaultHeaders: string[] = ['content-type', 'content-encoding'];

export type HttpServerConfig = {
	tag: string
	port: number;
	baseUrl: string;
	pathPrefix?: string;
	cors: {
		origins?: string[];
		methods?: string[];
		headers: string[];
		responseHeaders: string[];
	};
	ssl?: { key: string; cert: string };
	bodyParserLimit?: number | string;
};

export type CustomOrigin = (origin: string | undefined, callback: (err: Error | null, origin?: string) => void) => (boolean | Promise<boolean>);

const DefaultHttpServerConfig: HttpServerConfig = {
	tag: 'http-server-default',
	port: 3000,
	baseUrl: '',
	cors: {headers: [], responseHeaders: []}
};

export class HttpServer
	extends Logger {

	static default: HttpServer;

	static getDefault(): HttpServer {
		if (!HttpServer.default)
			HttpServer.default = new HttpServer(DefaultHttpServerConfig);
		return HttpServer.default;
	}

	private static readonly expressMiddleware: ExpressRequestHandler[] = [];
	private readonly instanceMiddleware: ExpressRequestHandler[] = [];
	private readonly routes: ServerApi<any>[] = [];
	readonly express!: Express;
	private server!: Server;
	private socketId: number = 0;
	private customCorsOriginValidator: CustomOrigin | undefined;
	private config: HttpServerConfig;

	constructor(config: HttpServerConfig) {
		super(config.tag ?? 'http-server');
		this.config = config;
	}

	getExpress(): Express {
		if (this.express)
			return this.express;
		return (this as { express: Express }).express = express();
	}

	static addMiddleware(middleware: ExpressRequestHandler): typeof HttpServer {
		HttpServer.expressMiddleware.push(middleware);
		return this;
	}

	/** Adds middleware for this server instance only (runs after static middleware, before routes). Call before init(). */
	addMiddleware(middleware: ExpressRequestHandler): this {
		this.instanceMiddleware.push(middleware);
		return this;
	}

	getBaseUrl(): string {
		return this.config.baseUrl ?? '';
	}

	addRoute(api: ServerApi<any>): void {
		if (this.routes.some(r => r.apiDef.path === api.apiDef.path))
			throw new Error(`Duplicate API path: ${api.apiDef.path}`);
		this.routes.push(api);
		const pathPrefix = this.config.pathPrefix ?? '';
		const baseUrl = this.getBaseUrl();
		api.route(this.getExpress() as unknown as ExpressRouter, pathPrefix, baseUrl);
	}

	setCustomCorsOriginValidator(validator: CustomOrigin): this {
		this.customCorsOriginValidator = validator;
		return this;
	}

	public async init(): Promise<void> {
		this.setMinLevel(ServerApi.isDebug ? LogLevel.Verbose : LogLevel.Info);
		let baseUrl = this.config.baseUrl ?? '';
		if (baseUrl) {
			if (baseUrl.endsWith('/'))
				baseUrl = baseUrl.substring(0, baseUrl.length - 1);
			baseUrl = baseUrl.replace(/\/\//g, '/');
			(this.config as { baseUrl: string }).baseUrl = baseUrl;
		}

		this.getExpress().use((req, res, next) => {
			if (req)
				(req as { url: string }).url = req.url.replace(/\/\//g, '/');
			next();
		});

		const parserLimit = this.config.bodyParserLimit;
		if (parserLimit) {
			const limit = parserLimit as number;
			const jsonParser = express.json({limit, type: 'application/json'});
			const textParser = express.text({limit, type: 'text/plain'});
			this.getExpress().use((req, res, next) => {
				const alreadyHasBody = (req as { body?: unknown }).body !== undefined;
				const notReadable = !req.readable;
				if (alreadyHasBody || notReadable)
					return next();

				const ct = (req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase();
				if (ct === 'application/json')
					return jsonParser(req, res, next);
				if (ct === 'text/plain')
					return textParser(req, res, next);
				return next();
			});
		}

		this.getExpress().use(compression());
		for (const middleware of HttpServer.expressMiddleware)
			this.getExpress().use(middleware);
		for (const middleware of this.instanceMiddleware)
			this.getExpress().use(middleware);

		const _cors = this.config.cors ?? {headers: [], responseHeaders: []};
		_cors.headers = DefaultHeaders.reduce<string[]>((toRet, item) => {
			if (!toRet.includes(item))
				addItemToArray(toRet, item);

			return toRet;
		}, _cors.headers ?? []);

		const resolveCorsOrigin = (origin?: string | string[]): string | undefined => {
			const _origin = typeof origin === 'string' ? origin : origin?.[0];
			if (!_origin)
				return undefined;

			if (!_cors.origins)
				return _origin;

			for (const allowedOrigin of _cors.origins) {
				if (allowedOrigin === _origin.toLowerCase() ||
					(allowedOrigin.includes('*') && new RegExp(`^${allowedOrigin.replace(/\*/g, '.*')}$`).test(_origin.toLowerCase())))
					return _origin;
			}
			return undefined;
		};

		this.getExpress().use(cors({
			origin: async (origin: string | undefined, callback: (err: Error | null, origin?: string) => void) => {
				if (!origin)
					return callback(null);

				const resolvedOrigin = resolveCorsOrigin(origin);
				if (!resolvedOrigin)
					return callback(new Error(`CORS: Origin '${origin}' not in config: ${JSON.stringify(_cors.origins)}`), undefined);

				if (this.customCorsOriginValidator && !(await this.customCorsOriginValidator(origin, callback)))
					return callback(new Error(`CORS: Origin '${origin}' not valid`), undefined);

				callback(null, resolvedOrigin);
			},
			methods: _cors.methods ?? ALL_Methods,
			allowedHeaders: _cors.headers,
			exposedHeaders: _cors.responseHeaders ?? [],
		}));

		this.getExpress().options('*', (_req: ExpressRequest, res: ExpressResponse) => {
			res.end();
		});
	}

	private createServer(): Server {
		const ssl = this.config.ssl;
		if (!ssl) {
			this.logDebug('starting HTTP server');
			return createHttpServer(this.getExpress());
		}

		this.logDebug('starting HTTPS server');
		let key = ssl.key;
		if (!ssl.key.startsWith('-----BEGIN'))
			key = fs.readFileSync(ssl.key, 'utf8');

		let cert = ssl.cert;
		if (!ssl.cert.startsWith('-----BEGIN'))
			cert = fs.readFileSync(ssl.cert, 'utf8');

		return createHttpsServer({key, cert, rejectUnauthorized: false, requestCert: false}, this.getExpress());
	}

	public async startServer(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.server = this.createServer();
			this.server.listen(this.config.port);
			this.server.on('connection', (socket: Socket) => {
				this.logInfo(`New connection (${this.socketId++}): ${socket}`);
			});

			this.server.on('error', (error: NodeJS.ErrnoException) => {
				switch (error.code) {
					case 'EACCES':
						this.logErrorBold(`Port ${this.config.port} requires elevated privileges`);
						process.exit(1);
						break;

					case 'EADDRINUSE':
						this.logErrorBold(`Port ${this.config.port} already in use`);
						reject(error);
						break;

					default:
						this.logErrorBold(`Server error: ${error.code}`);
						reject(error);
				}

				if (error.syscall !== 'listen')
					reject(error);
			});

			this.server.on('listening', () => {
				const address = this.server.address();
				if (!address) {
					this.logDebug('Exiting');
					return process.exit(1);
				}

				this.logDebug(`Listening on ${typeof address === 'string' ? address : `port ${address.port}`}`);
				resolve();
			});
		});
	}

	public terminate(): Promise<void> {
		return new Promise<void>(resolve => {
			this.server.close(() => {
				this.logInfo('Server terminated');
				resolve();
			});
		});
	}
}
