/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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
import {EventContext, RuntimeOptions} from 'firebase-functions';

import {Express, Request, Response} from 'express';
import {addItemToArray, StringMap} from '@nu-art/ts-common';
import {HttpsFunction, onRequest} from 'firebase-functions/v2/https';
import {HttpsOptions} from 'firebase-functions/lib/v2/providers/https';


export interface LocalRequest
	extends Request {
	rawBody: Buffer;
}

export interface TBR_ExpressFunctionInterface {
	getExpressFunction(): Firebase_ExpressFunction;
}

export interface FirebaseFunctionInterface {
	getFunction(): HttpsFunction;

	onFunctionReady(): Promise<void>;
}

export class Firebase_ExpressFunction
	implements FirebaseFunctionInterface {
	private readonly express: Express;
	private function!: HttpsFunction;
	private toBeExecuted: (() => void | Promise<void>)[] = [];
	private isReady: boolean = false;
	private toBeResolved!: (value?: (PromiseLike<any>)) => void;
	private name: string = 'api';
	static config: HttpsOptions = {};

	constructor(_express: Express) {
		this.express = _express;
	}

	setName(name: string) {
		this.name = name;
		return this;
	}

	static setConfig(config: HttpsOptions) {
		this.config = config;
	}

	getName() {
		return this.name;
	}

	getFunction = () => {
		if (this.function)
			return this.function;

		const realFunction: HttpsFunction = onRequest(Firebase_ExpressFunction.config, this.express as (request: LocalRequest, response: Response) => void | Promise<void>);
		return this.function = onRequest(Firebase_ExpressFunction.config, (req: LocalRequest, res: Response) => {
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

	onFunctionReady = async () => {
		this.isReady = true;
		const toBeExecuted = this.toBeExecuted;
		this.toBeExecuted = [];
		for (const toExecute of toBeExecuted) {
			try {
				await toExecute();
			} catch (e: any) {
				console.error('Error running function: ', e);
			}
		}

		this.toBeResolved && this.toBeResolved();
	};
}

export type FirestoreConfigs = {
	runTimeOptions?: RuntimeOptions,
	configs: any
}

export type BucketConfigs = {
	runtimeOpts?: RuntimeOptions
	path: string
	bucketName?: string
}

export type FirebaseEventContext = EventContext;

export type TopicMessage = { data: string, attributes: StringMap };



