/*
 * @nu-art/http-client - Local echo server for HTTP client tests
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createServer, get as httpGet, type IncomingMessage, type Server, type ServerResponse} from 'node:http';
import {gunzipSync} from 'node:zlib';
import {BadImplementationException, Logger} from '@nu-art/ts-common';

const Host_TestEcho = '127.0.0.1';
const Port_TestEcho = 17321;
const Marker_HttpTestEcho = 'http-client-test';
const Max_EchoBodyBytes = 1_048_576;
const Max_EchoDelaySeconds = 30;
const Max_EchoByteLength = 1_000_000;
const Max_EchoStreamLines = 100;

/**
 * In-process echo for the routes the HTTP client tests call.
 * Binds 127.0.0.1:17321. If that port is already this server, tests reuse it.
 */
export class TestEchoServer
	extends Logger {

	public readonly origin = `http://${Host_TestEcho}:${Port_TestEcho}`;
	private readonly host = Host_TestEcho;
	private readonly port = Port_TestEcho;
	private server?: Server;
	private starting?: Promise<void>;

	public constructor() {
		super('TestEchoServer');
	}

	public start(): Promise<void> {
		if (this.server?.listening)
			return Promise.resolve();

		if (this.starting)
			return this.starting;

		this.starting = this.bind();
		return this.starting;
	}

	private bind(): Promise<void> {
		return new Promise((resolve, reject) => {
			const server = createServer((req, res) => {
				this.handle(req, res).catch((error: unknown) => this.fail(res, error));
			});

			const onError = (error: NodeJS.ErrnoException) => {
				this.starting = undefined;
				if (error.code !== 'EADDRINUSE') {
					reject(error);
					return;
				}

				this.adoptExisting().then(resolve, reject);
			};

			server.once('error', onError);
			server.listen(this.port, this.host, () => {
				server.off('error', onError);
				server.unref();
				this.server = server;
				this.logInfo(`echo server listening host=${this.host} port=${this.port}`);
				resolve();
			});
		});
	}

	private async adoptExisting(): Promise<void> {
		const ours = await this.probe();
		if (!ours)
			throw new BadImplementationException(`port ${this.port} on ${this.host} is in use and is not the HTTP test echo server`);

		this.logWarning(`echo server already listening host=${this.host} port=${this.port}`);
	}

	private probe(): Promise<boolean> {
		return new Promise((resolve) => {
			const req = httpGet(`${this.origin}/health`, {timeout: 500}, (res) => {
				const chunks: Buffer[] = [];
				res.on('data', (chunk: Buffer) => {
					chunks.push(chunk);
				});
				res.on('end', () => {
					const body = Buffer.concat(chunks).toString('utf8');
					resolve(res.statusCode === 200 && body.includes(Marker_HttpTestEcho));
				});
			});
			req.on('error', () => resolve(false));
			req.on('timeout', () => {
				req.destroy();
				resolve(false);
			});
		});
	}

	private fail(res: ServerResponse, error: unknown): void {
		const message = error instanceof Error ? error.message : 'unknown error';
		this.logError('echo request failed', {message});
		if (res.headersSent || res.writableEnded)
			return;

		res.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
		res.end(message);
	}

	private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		const method = req.method ?? 'GET';
		if (method === 'HEAD' || method === 'OPTIONS') {
			res.writeHead(200);
			res.end();
			return;
		}

		const rawUrl = req.url ?? '/';
		const requestUrl = new URL(rawUrl, this.origin);
		const segments = requestUrl.pathname.split('/').filter(segment => segment.length > 0);
		const root = segments[0] ?? '';

		switch (root) {
			case 'health':
				this.sendJson(res, 200, {echo: Marker_HttpTestEcho});
				return;
			case 'get':
			case 'post':
			case 'put':
			case 'patch':
			case 'delete':
				await this.sendEcho(req, res, rawUrl, requestUrl);
				return;
			case 'headers':
				this.sendJson(res, 200, {headers: this.headerMap(req)});
				return;
			case 'delay':
				await this.sendDelay(req, res, segments[1]);
				return;
			case 'bytes':
				this.sendBytes(res, segments[1]);
				return;
			case 'stream':
				this.sendStream(res, segments[1]);
				return;
			case 'robots.txt':
				this.sendText(res, 200, 'User-agent: *\nDisallow:\n');
				return;
			case 'json':
				this.sendJson(res, 200, {slideshow: {title: 'local-echo'}});
				return;
			case 'response-headers':
				this.sendResponseHeaders(res, requestUrl);
				return;
			case 'status':
				this.sendStatus(res, segments[1]);
				return;
			default:
				this.sendJson(res, 404, {error: 'unknown path', path: requestUrl.pathname});
		}
	}

	private async sendEcho(req: IncomingMessage, res: ServerResponse, rawUrl: string, requestUrl: URL): Promise<void> {
		const raw = this.decodeBody(req, await this.readBody(req));
		const contentType = req.headers['content-type'];
		const data = raw.toString('utf8');
		const echoed = {
			args: this.queryArgs(requestUrl),
			data,
			json: this.parseJson(contentType, data),
			url: `${this.origin}${rawUrl}`,
			headers: this.headerMap(req),
		};
		this.sendJson(res, 200, echoed);
	}

	private async sendDelay(req: IncomingMessage, res: ServerResponse, rawSeconds: string | undefined): Promise<void> {
		const seconds = Number(rawSeconds);
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > Max_EchoDelaySeconds) {
			this.sendJson(res, 400, {error: 'bad delay'});
			return;
		}

		const completed = await this.sleepOrClose(req, res, seconds * 1000);
		if (!completed)
			return;

		this.sendJson(res, 200, {delay: seconds});
	}

	private sendBytes(res: ServerResponse, rawLength: string | undefined): void {
		const length = Number(rawLength);
		if (!Number.isInteger(length) || length < 0 || length > Max_EchoByteLength) {
			this.sendJson(res, 400, {error: 'bad byte length'});
			return;
		}

		const body = Buffer.alloc(length, 0x61);
		res.writeHead(200, {
			'content-type': 'application/octet-stream',
			'content-length': length,
		});
		res.end(body);
	}

	private sendStream(res: ServerResponse, rawCount: string | undefined): void {
		const count = Number(rawCount);
		if (!Number.isInteger(count) || count < 0 || count > Max_EchoStreamLines) {
			this.sendJson(res, 400, {error: 'bad stream length'});
			return;
		}

		const lines: string[] = [];
		for (let i = 0; i < count; i++)
			lines.push(JSON.stringify({id: i}));

		this.sendText(res, 200, `${lines.join('\n')}\n`);
	}

	private sendResponseHeaders(res: ServerResponse, requestUrl: URL): void {
		const body: Record<string, string> = {};
		requestUrl.searchParams.forEach((value, key) => {
			body[key] = value;
		});
		const payload = JSON.stringify(body);
		res.writeHead(200, {
			...body,
			'content-type': 'application/json; charset=utf-8',
			'content-length': Buffer.byteLength(payload),
		});
		res.end(payload);
	}

	private sendStatus(res: ServerResponse, rawCode: string | undefined): void {
		const code = Number(rawCode);
		if (!Number.isInteger(code) || code < 100 || code > 599) {
			this.sendJson(res, 400, {error: 'bad status'});
			return;
		}

		if (code === 204 || code === 304) {
			res.writeHead(code);
			res.end();
			return;
		}

		this.sendJson(res, code, {status: code});
	}

	private queryArgs(requestUrl: URL): Record<string, string> {
		const args: Record<string, string> = {};
		requestUrl.searchParams.forEach((value, key) => {
			args[key] = value;
		});
		return args;
	}

	private headerMap(req: IncomingMessage): Record<string, string> {
		const headers: Record<string, string> = {};
		const raw = req.rawHeaders;
		for (let i = 0; i < raw.length; i += 2) {
			const name = this.canonicalHeaderName(raw[i]);
			const value = raw[i + 1];
			const existing = headers[name];
			headers[name] = existing ? `${existing}, ${value}` : value;
		}
		return headers;
	}

	private canonicalHeaderName(name: string): string {
		return name.split('-').map(part => {
			if (part.length === 0)
				return part;

			return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
		}).join('-');
	}

	private parseJson(contentType: string | undefined, data: string): unknown {
		if (!contentType?.includes('application/json') || data.length === 0)
			return null;

		return JSON.parse(data);
	}

	private decodeBody(req: IncomingMessage, raw: Buffer): Buffer {
		const encoding = req.headers['content-encoding'];
		if (typeof encoding !== 'string' || !encoding.includes('gzip'))
			return raw;

		return gunzipSync(raw);
	}

	private readBody(req: IncomingMessage): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			let size = 0;
			let settled = false;
			const fail = (error: unknown) => {
				if (settled)
					return;

				settled = true;
				reject(error);
			};

			req.on('data', (chunk: Buffer | string) => {
				const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
				size += buf.length;
				if (size > Max_EchoBodyBytes) {
					fail(new BadImplementationException(`echo body exceeds ${Max_EchoBodyBytes} bytes`));
					req.destroy();
					return;
				}

				chunks.push(buf);
			});
			req.on('end', () => {
				if (settled)
					return;

				settled = true;
				resolve(Buffer.concat(chunks));
			});
			req.on('error', fail);
		});
	}

	private sleepOrClose(req: IncomingMessage, res: ServerResponse, ms: number): Promise<boolean> {
		return new Promise((resolve) => {
			let settled = false;
			const finish = (completed: boolean) => {
				if (settled)
					return;

				settled = true;
				clearTimeout(timer);
				resolve(completed);
			};
			const timer = setTimeout(() => finish(true), ms);
			const onGone = () => {
				if (res.writableEnded)
					return;

				finish(false);
			};
			req.on('aborted', onGone);
			res.on('close', onGone);
		});
	}

	private sendJson(res: ServerResponse, status: number, body: unknown): void {
		this.sendText(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
	}

	private sendText(res: ServerResponse, status: number, body: string, contentType = 'text/plain; charset=utf-8'): void {
		res.writeHead(status, {
			'content-type': contentType,
			'content-length': Buffer.byteLength(body),
		});
		res.end(body);
	}
}

export const testEchoServer = new TestEchoServer();
export const testEchoOrigin = testEchoServer.origin;
