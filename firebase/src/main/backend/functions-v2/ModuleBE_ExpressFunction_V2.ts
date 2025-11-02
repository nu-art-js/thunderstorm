import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction.js';
import {addItemToArray} from '@nu-art/ts-common';
import express, {Express} from 'express';
import {HttpsOptions, HttpsFunction, onRequest} from 'firebase-functions/v2/https';
import {WebSocket, WebSocketServer} from 'ws';


export class ModuleBE_ExpressFunction_V2<Config = {}>
	extends ModuleBE_BaseFunction<{ options: HttpsOptions } & Config> {
	private function!: HttpsFunction;

	protected constructor(name: string = 'api') {
		super(name);
	}

	getFunction = () => {
		if (this.function)
			return this.function;
		const _express = express();
		const realFunction = this.createFunction(_express);
		return this.function = onRequest(this.config.options, (req, res) => {
			if (this.isReady) { // @ts-ignore
				return realFunction(req, res);
			}

			return new Promise((resolve) => {
				// @ts-ignore
				addItemToArray(this.toBeExecuted, () => realFunction(req, res));
				this.toBeResolved = resolve;
			});
		});
	};

	protected createFunction(_express: Express) {
		return onRequest(this.config.options, _express);
	}
}

export class ModuleBE_SocketFunction
	extends ModuleBE_ExpressFunction_V2 {

	protected createFunction(_express: Express) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const server = require('http').createServer(_express);
		const wss = new WebSocketServer({server});

		wss.on('connection', (ws: WebSocket) => {
			ws.on('message', (message: string) => {
				console.log(`Received: ${message}`);
				ws.send(`Echo: ${message}`);
			});
		});

		_express.get('/', (req, res) => {
			res.send('WebSocket Server');
		});

		return onRequest(this.config.options, server);
	}
}