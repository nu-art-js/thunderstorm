import {__stringify, dispatch_onApplicationNotification, ServerErrorSeverity, TS_Object} from '@nu-art/ts-common';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';
import {CloudFunction} from 'firebase-functions';
import {ObjectMetadata} from 'firebase-functions/lib/v1/providers/storage';
import {Message} from 'firebase-admin/lib/messaging/messaging-api';
import {FirebaseEventContext, TopicMessage} from '../functions/firebase-function';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const functions = require('firebase-functions');

export abstract class ModuleBE_PubSubFunction<T extends TS_Object>
	extends ModuleBE_BaseFunction {

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