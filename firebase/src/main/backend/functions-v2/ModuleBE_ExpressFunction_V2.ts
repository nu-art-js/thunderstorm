import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';
import {addItemToArray} from '@nu-art/ts-common';
import * as express from 'express';
import {Express, Response} from 'express';
import {HttpsFunction, onRequest} from 'firebase-functions/v2/https';
import {HttpsOptions} from 'firebase-functions/lib/v2/providers/https';
import {LocalRequest} from '../functions/firebase-function';
import {WebSocket} from 'ws';

export class ModuleBE_ExpressFunction_V2
	extends ModuleBE_BaseFunction<{ options: HttpsOptions }> {
	private function!: HttpsFunction;

	protected constructor(name: string = 'api') {
		super(name);
	}

	getFunction = () => {
		if (this.function)
			return this.function;
		const _express = express();
		const realFunction = this.createFunction(_express);
		return this.function = onRequest(this.config.options, (req: LocalRequest, res: Response) => {
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
		return onRequest(this.config.options, _express as (request: LocalRequest, response: Response) => void | Promise<void>);
	}
}

export class ModuleBE_SocketFunction
	extends ModuleBE_ExpressFunction_V2 {


	protected createFunction(_express: Express) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const server = require('http').createServer(_express);
		const wss = new WebSocket.Server({server});

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