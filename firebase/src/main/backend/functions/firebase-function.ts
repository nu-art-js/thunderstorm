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
import {Change, CloudFunction, EventContext, RuntimeOptions} from 'firebase-functions';

import * as express from 'express';
import {Response} from 'express';
import {
	__stringify,
	addItemToArray,
	deepClone,
	dispatch_onApplicationNotification,
	ImplementationMissingException,
	Module,
	ServerErrorSeverity,
	StringMap,
	TS_Object
} from '@nu-art/ts-common';
import {DocumentSnapshot} from 'firebase-admin/firestore';
import {DataSnapshot} from 'firebase-functions/lib/common/providers/database';
import {ObjectMetadata} from 'firebase-functions/v1/storage';
import {Message} from 'firebase-admin/lib/messaging/messaging-api';
import {HttpsFunction, onRequest} from 'firebase-functions/v2/https';
import {HttpsOptions} from 'firebase-functions/lib/v2/providers/https';


export interface Request
	extends express.Request {
	rawBody: Buffer;
}

const functions = require('firebase-functions');

export interface TBR_ExpressFunctionInterface {
	getExpressFunction(): Firebase_ExpressFunction;
}

export interface FirebaseFunctionInterface {
	getFunction(): HttpsFunction;

	onFunctionReady(): Promise<void>;
}

export abstract class FirebaseFunction<Config = any>
	extends Module<Config>
	implements FirebaseFunctionInterface {
	protected isReady: boolean = false;
	protected toBeExecuted: (() => Promise<any>)[] = [];
	protected toBeResolved!: (value?: (PromiseLike<any>)) => void;

	protected constructor(tag?: string) {
		super(tag);
		this.onFunctionReady = this.onFunctionReady.bind(this);
	}

	abstract getFunction(): any

	protected async handleCallback(callback: () => Promise<any>) {
		if (this.isReady)
			return await callback();

		return new Promise((resolve) => {
			addItemToArray(this.toBeExecuted, async () => await callback());

			this.toBeResolved = resolve;
		});
	}

	onFunctionReady = async () => {
		this.isReady = true;
		const toBeExecuted = this.toBeExecuted;
		this.toBeExecuted = [];
		for (const toExecute of toBeExecuted) {
			try {
				await toExecute();
			} catch (e: any) {
				await dispatch_onApplicationNotification.dispatchModuleAsync(ServerErrorSeverity.Critical, this, e.message);
			}
		}

		this.toBeResolved && this.toBeResolved();
	};
}

export class Firebase_ExpressFunction
	implements FirebaseFunctionInterface {
	private readonly express: express.Express;
	private function!: HttpsFunction;
	private toBeExecuted: (() => void | Promise<void>)[] = [];
	private isReady: boolean = false;
	private toBeResolved!: (value?: (PromiseLike<any>)) => void;
	private name: string = 'api';
	static config: HttpsOptions = {};

	constructor(_express: express.Express) {
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

		const realFunction: HttpsFunction = onRequest(Firebase_ExpressFunction.config, this.express as (request: Request, response: express.Response) => void | Promise<void>);
		return this.function = onRequest(Firebase_ExpressFunction.config, (req: Request, res: Response) => {
			if (this.isReady)
				return realFunction(req, res);

			return new Promise((resolve) => {
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

//TODO: I would like to add a type for the params..
export abstract class FirebaseFunctionModule<DataType = any, ConfigType = any>
	extends FirebaseFunction<ConfigType> {

	private readonly listeningPath: string;
	private function!: CloudFunction<Change<DataSnapshot>>;

	protected constructor(listeningPath: string, name?: string) {
		super();
		name && this.setName(name);
		this.listeningPath = listeningPath;
	}

	abstract processChanges(before: DataType, after: DataType, params: { [param: string]: any }): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		return this.function = functions.database.ref(this.listeningPath).onWrite(
			(change: Change<DataSnapshot>, context: EventContext) => {
				const before: DataType = change.before && change.before.val();
				const after: DataType = change.after && change.after.val();
				const params = deepClone(context.params);

				return this.handleCallback(() => this.processChanges(before, after, params));
			});
	};
}

export type FirestoreConfigs = {
	runTimeOptions?: RuntimeOptions,
	configs: any
}

//TODO: I would like to add a type for the params..
export abstract class FirestoreFunctionModule<DataType extends TS_Object, ConfigType extends FirestoreConfigs = FirestoreConfigs>
	extends FirebaseFunction<ConfigType> {

	private readonly collectionName: string;
	private function!: CloudFunction<Change<DataSnapshot>>;

	protected constructor(collectionName: string, name?: string, tag?: string) {
		super(tag);
		name && this.setName(name);
		this.collectionName = collectionName;
	}

	abstract processChanges(params: { [param: string]: any }, before?: DataType, after?: DataType): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		return this.function = functions.runWith(this.config?.runTimeOptions || {}).firestore.document(`${this.collectionName}/{docId}`).onWrite(
			(change: Change<DocumentSnapshot<DataType>>, context: EventContext) => {
				const before: DataType | undefined = change.before && change.before.data();
				const after: DataType | undefined = change.after && change.after.data();
				const params = deepClone(context.params);

				return this.handleCallback(() => this.processChanges(params, before, after));
			});
	};
}

/**
 An abstract class representing a scheduled Firebase Cloud Function.
 It extends the FirebaseFunction class and adds scheduling capabilities.
 */
export abstract class FirebaseScheduledFunction<ConfigType extends any = any>//tttttttttttt
	extends FirebaseFunction<ConfigType> {

	private function!: CloudFunction<Change<DataSnapshot>>;
	private schedule?: string;
	private runningCondition: (() => Promise<boolean>)[] = [async () => true];
	private runtimeOptions: RuntimeOptions = {};

	/**
	 *
	 * @param name
	 * @param tag
	 * @protected
	 */
	protected constructor(name?: string, tag?: string) {
		super(tag);
		name && this.setName(name);
	}

	protected setRuntimeOptions(runtimeOptions: RuntimeOptions) {
		this.runtimeOptions = runtimeOptions;
	}

	/**
	 * Add a running condition to the list of conditions that must pass in order for the backup to execute
	 */
	addRunningCondition(runningCondition: () => Promise<boolean>) {
		addItemToArray(this.runningCondition, runningCondition);
		return this;
	}

	/**
	 * Set the schedule for this scheduled event
	 */
	setSchedule(schedule: string) {
		this.schedule = schedule;
		return this;
	}

	abstract onScheduledEvent(): Promise<any>;

	/**
	 * Check all running conditions,
	 * return early if any fail
	 */
	private _onScheduledEvent = async () => {
		const results: boolean[] = await Promise.all(this.runningCondition.map(condition => condition()));

		if (results.includes(false)) {
			this.logDebug('will not execute backup.. running conditions didn\'t pass: ', results);
			return;
		}
		return this.onScheduledEvent();
	};

	getFunction = () => {
		if (!this.schedule)
			throw new ImplementationMissingException('MUST set schedule !!');

		if (this.function)
			return this.function;

		return this.function = functions.runWith(this.runtimeOptions).pubsub.schedule(this.schedule).onRun(async () => {
			return this.handleCallback(() => this._onScheduledEvent());
		});
	};
}

export type BucketConfigs = {
	runtimeOpts?: RuntimeOptions
	path: string
	bucketName?: string
}

export abstract class Firebase_StorageFunction<ConfigType extends BucketConfigs = BucketConfigs>
	extends FirebaseFunction<ConfigType> {

	private function!: CloudFunction<ObjectMetadata>;
	private runtimeOpts: RuntimeOptions = {};

	protected constructor(path?: string, name?: string) {
		super();
		if (path)
			this.setDefaultConfig({path: path} as Partial<ConfigType>);

		name && this.setName(name);
	}

	abstract onFinalize(object: ObjectMetadata, context: EventContext): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		this.runtimeOpts = {
			timeoutSeconds: this.config?.runtimeOpts?.timeoutSeconds || 300,
			memory: this.config?.runtimeOpts?.memory || '2GB'
		};

		return this.function = functions.runWith(this.runtimeOpts).storage.bucket(this.config.bucketName).object().onFinalize(
			async (object: ObjectMetadata, context: EventContext) => {
				try {
					return await this.handleCallback(() => this.onFinalize(object, context));
				} catch (e: any) {
					const _message = `Error handling callback to onFinalize bucket listener method on path:` + this.config.path +
						'\n' + `File changed ${object.name}` + '\n with attributes: ' + __stringify(context) + '\n' + __stringify(e);
					this.logError(_message);
					try {
						await dispatch_onApplicationNotification.dispatchModuleAsync(ServerErrorSeverity.Critical, this, {message: _message});
					} catch (_e: any) {
						this.logError('Error while handing bucket listener error', _e);
					}
					throw e;
				}
			});
	};
}

export type FirebaseEventContext = EventContext;

export type TopicMessage = { data: string, attributes: StringMap };

export abstract class Firebase_PubSubFunction<T extends TS_Object>
	extends FirebaseFunction {

	private function!: CloudFunction<ObjectMetadata>;
	private readonly topic: string;

	protected constructor(topic: string, tag?: string) {
		super(tag);
		this.topic = topic;
	}

	abstract onPublish(object: T | undefined, originalMessage: TopicMessage, context: FirebaseEventContext): Promise<any>;

	private _onPublish = async (object: T | undefined, originalMessage: TopicMessage, context: FirebaseEventContext) => {
		try {
			return await this.onPublish(object, originalMessage, context);
		} catch (e: any) {
			const _message = `Error publishing pub/sub message` + __stringify(object) +
				'\n' + ` to topic ${this.topic}` + '\n with attributes: ' + __stringify(originalMessage.attributes) + '\n' + __stringify(e);
			this.logError(_message);
			try {
				await dispatch_onApplicationNotification.dispatchModuleAsync(ServerErrorSeverity.Critical, this, {message: _message});
			} catch (_e: any) {
				this.logError('Error while handing pubsub error', _e);
			}
			throw e;
		}
	};

	getFunction = () => {
		if (this.function)
			return this.function;

		return this.function = functions.pubsub.topic(this.topic).onPublish(async (message: Message, context: FirebaseEventContext) => {
			// need to validate etc...
			// @ts-ignore
			const originalMessage: TopicMessage = message;

			let data: T | undefined;
			try {
				data = JSON.parse(Buffer.from(originalMessage.data, 'base64').toString());
			} catch (e: any) {
				this.logError(`Error parsing the data attribute from pub/sub message to topic ${this.topic}` +
					'\n' + __stringify(originalMessage.data) + '\n' + __stringify(e));
			}

			return this.handleCallback(() => this._onPublish(data, originalMessage, context));
		});
	};
}

