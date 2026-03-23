import {__stringify, dispatch_onApplicationNotification, ImplementationMissingException, ServerErrorSeverity, StringMap, TS_Object} from '@nu-art/ts-common';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction.js';

export type TopicMessage = { data: string; attributes: StringMap };
import {CloudEvent, CloudFunction} from 'firebase-functions/v2';
import {MessagePublishedData, onMessagePublished, PubSubOptions} from 'firebase-functions/v2/pubsub';

export abstract class ModuleBE_PubSubFunction<T extends TS_Object>
	extends ModuleBE_BaseFunction {

	private function!: CloudFunction<CloudEvent<MessagePublishedData<any>>>;
	private readonly topic: string;

	protected constructor(topic: string, tag?: string) {
		super(tag);
		this.topic = topic;
		this.addToClassStack(ModuleBE_PubSubFunction);
	}

	abstract onPublish(object: T | undefined, originalMessage: TopicMessage, event: CloudEvent<MessagePublishedData>): Promise<any>;

	private _onPublish = async (object: T | undefined, originalMessage: TopicMessage, event: CloudEvent<MessagePublishedData>) => {
		try {
			return await this.onPublish(object, originalMessage, event);
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
		if (!this.config.topic)
			throw new ImplementationMissingException('MUST set a topic !!');

		if (this.function)
			return this.function;

		return this.function = onMessagePublished(this.config as PubSubOptions, async (event) => {
			// need to validate etc...
			const originalMessage = event.data.message;

			let data: T | undefined;
			try {
				data = JSON.parse(Buffer.from(originalMessage.data, 'base64').toString());
			} catch (e: any) {
				this.logError(`Error parsing the data attribute from pub/sub message to topic ${this.topic}` +
					'\n' + __stringify(originalMessage.data) + '\n' + __stringify(e));
			}

			return this.handleCallback(() => this._onPublish(data, originalMessage, event));
		});
	};
}