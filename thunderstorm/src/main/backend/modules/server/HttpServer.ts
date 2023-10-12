/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Module dependencies.
 */

import * as compression from 'compression';

import {Server} from 'http';
import {Socket} from 'net';
import * as fs from 'fs';
import {addItemToArray, LogLevel, Module} from '@nu-art/ts-common';
import * as express from 'express';

import {Express, ExpressRequest, ExpressRequestHandler, ExpressResponse, HttpErrorHandler} from '../../utils/types';
import {DefaultApiErrorMessageComposer} from './server-errors';
import {Firebase_ExpressFunction, TBR_ExpressFunctionInterface} from '@nu-art/firebase/backend';
import {ServerApi} from './server-api';


const ALL_Methods: string[] = [
	'GET',
	'PUT',
	'PATCH',
	'POST',
	'DELETE',
	'OPTIONS'];

const DefaultHeaders: string[] = [
	'content-type',
	'content-encoding',];

type ConfigType = {
	port: number;
	baseUrl: string;
	cors: {
		origins?: string[],
		methods?: string[],
		headers: string[],
		responseHeaders: string[],
	}
	ssl: { key: string, cert: string }
	bodyParserLimit: number | string
};

export class HttpServer_Class
	extends Module<ConfigType>
	implements TBR_ExpressFunctionInterface {

	private static readonly expressMiddleware: ExpressRequestHandler[] = [];
	errorMessageComposer: HttpErrorHandler = DefaultApiErrorMessageComposer();
	readonly express: Express;
	private server!: Server;
	private socketId: number = 0;

	constructor() {
		super('http-server');
		this.express = express();
	}

	getExpressFunction() {
		return new Firebase_ExpressFunction(HttpServer.express);
	}

	setErrorMessageComposer(errorMessageComposer: HttpErrorHandler) {
		this.errorMessageComposer = errorMessageComposer;
	}

	static addMiddleware(middleware: ExpressRequestHandler) {
		HttpServer_Class.expressMiddleware.push(middleware);
		return this;
	}

	getBaseUrl() {
		return this.config.baseUrl;
	}

	protected async init() {
		this.setMinLevel(ServerApi.isDebug ? LogLevel.Verbose : LogLevel.Info);
		const baseUrl = this.config.baseUrl;
		if (baseUrl) {
			if (baseUrl.endsWith('/'))
				this.config.baseUrl = baseUrl.substring(0, baseUrl.length - 1);

			this.config.baseUrl = baseUrl.replace(/\/\//g, '/');
		}

		this.express.use((req, res, next) => {
			if (req)
				req.url = req.url.replace(/\/\//g, '/');

			next();
		});

		const parserLimit = this.config.bodyParserLimit;
		if (parserLimit)
			this.express.use(express.json({limit: parserLimit}));
		this.express.use(compression());
		for (const middleware of HttpServer_Class.expressMiddleware) {
			this.express.use(middleware);
		}

		const cors = this.config.cors || {};
		cors.headers = DefaultHeaders.reduce((toRet, item: string) => {
			if (!toRet.includes(item))
				addItemToArray(toRet, item);

			return toRet;
		}, cors.headers || []);

		const resolveCorsOrigin = (origin?: string | string[]): string | undefined => {
			let _origin: string;
			if (!origin)
				return;

			if (typeof origin === 'string')
				_origin = origin;
			else
				_origin = origin[0];

			if (!cors.origins)
				return _origin;

			if (cors.origins.indexOf(_origin.toLowerCase()) > -1)
				return _origin;
		};

		this.express.all('*', (req: ExpressRequest, res: ExpressResponse, next: express.NextFunction) => {
			let origin = req.headers.origin;
			if (origin) {
				origin = resolveCorsOrigin(origin);
				if (!origin)
					this.logWarning(`CORS issue!!!\n Origin: '${req.headers.origin}' does not exists in config: ${JSON.stringify(cors.origins)}`);
			}

			res.header('Access-Control-Allow-Origin', origin || 'N/A');
			res.header('Access-Control-Allow-Methods', (cors.methods || ALL_Methods)?.join(','));
			res.header('Access-Control-Allow-Headers', cors.headers?.join(','));
			res.header('Access-Control-Expose-Headers', cors.responseHeaders?.join(','));

			next();
		});
		this.express.options('*', (req: ExpressRequest, res: ExpressResponse) => {
			res.end();
		});
	}

	private createServer(): Server {
		const ssl = this.config.ssl;
		if (!ssl) {
			this.logDebug('starting HTTP server');
			return require('http').createServer(this.express);
		}

		this.logDebug('starting HTTPS server');
		let key = ssl.key;
		if (!ssl.key.startsWith('-----BEGIN'))
			key = fs.readFileSync(ssl.key, 'utf8');

		let cert = ssl.cert;
		if (!ssl.cert.startsWith('-----BEGIN'))
			cert = fs.readFileSync(ssl.cert, 'utf8');

		const options = {
			key: key,
			cert: cert,
			rejectUnauthorized: false,
			requestCert: false,
		};

		return require('https').createServer(options, this.express);
	}

	public async startServer(): Promise<void> {
		return new Promise<void>((resolve, rejected) => {
			this.connectImpl((err?: Error) => {
				if (err)
					return rejected(err);

				resolve();
			});
		});
	}

	private connectImpl(onCompletion: { (err?: Error): void; }) {
		this.server = this.createServer();

		this.server.listen(this.config.port);
		this.server.on('connection', (socket: Socket) => {
			this.logInfo(`Got a new connection(${this.socketId++}): ${socket}`);
			// Extend socket lifetime for demo purposes
			// socket.setTimeout(4000);
		});

		this.server.on('error', (error: any) => {
			switch (error.code) {
				case 'EACCES':
					this.logErrorBold(`Server port: ${this.config.port} requires elevated privileges`);
					process.exit(1);
					break;

				case 'EADDRINUSE':
					this.logErrorBold(`Unable to start server port(${this.config.port}) is already in use!`);
					onCompletion(error);
					break;

				default:
					this.logErrorBold(`Error starting server... unknown state: ${error.code}`);
					onCompletion(error);
					return;
			}

			if (error.syscall !== 'listen') {
				onCompletion(error);
				return;
			}

		});

		this.server.on('listening', () => {
			const address = this.server.address();

			// Explicit check has to be made due to address.port
			if (!address) {
				this.logDebug(`Exiting !!`);
				process.exit(1);
				return;
			}

			this.logDebug(`Server is listening on ${(typeof address === 'string' ? `pipe: ${JSON.stringify(address)}` : `port: ${address.port}`)}`);
			onCompletion();
		});
	}

	public terminate(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.server.close(() => {
				this.logInfo('Server is terminated!');
				resolve();
			});
		});
	}
}

export const HttpServer = new HttpServer_Class();

