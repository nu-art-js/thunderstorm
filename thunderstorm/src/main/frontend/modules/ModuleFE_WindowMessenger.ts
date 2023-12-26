import {Logger, Module, removeItemFromArray, TypedMap} from '@nu-art/ts-common';


export const Key_UndefinedMessage = 'undefined-message';

interface Messagable {
	postMessage(message: any, targetOrigin: string, transfer?: Transferable[]): void;

	postMessage(message: any, options?: WindowPostMessageOptions): void;
}

export type Message = {
	key: string
}

class ModuleFE_WindowMessenger_Class
	extends Module {

	//######################### Static #########################

	readonly receivers: BaseReceiver<any>[] = [];
	private listener?: (e: MessageEvent) => void;

	//######################### Life Cycle #########################

	addReceiver(receiver: BaseReceiver<any>) {
		if (this.receivers.includes(receiver))
			return;

		this.receivers.push(receiver);
		if (this.receivers.length > 0 && !this.listener)
			window.addEventListener('message', this.listener = (e: MessageEvent) => {
				const {data, origin} = e;
				this.receivers.forEach(receiver => receiver.execute(origin, data));
			});
	}

	removeReceiver(receiver: BaseReceiver<any>) {
		removeItemFromArray(this.receivers, receiver);
		if (this.receivers.length === 0) {
			window.removeEventListener('message', this.listener!);
			delete this.listener;
		}
	}

	sendMessage<T extends Message>(message: T, target: Messagable) {
		target.postMessage(message);
	}

	createMessenger<T extends Message>(target: Messagable) {
		return new Messenger<T>(target);
	}

	createReceiver<T extends Message>(origin?: string, transformer?: (data: any) => T[]) {
		return new Receiver(origin, transformer);
	}

	createRawReceiver(execute: (message: any) => void, origin?: string) {
		return new RawReceiver(execute, origin);
	}
}

export const ModuleFE_WindowMessenger = new ModuleFE_WindowMessenger_Class();

//Message Sender

export class Messenger<T extends Message> {
	readonly target: Messagable;

	constructor(target: Messagable) {
		this.target = target;
	}

	sendMessage(message: T) {
		ModuleFE_WindowMessenger.sendMessage(message, this.target);
	}
}

//Message Receiver

export abstract class BaseReceiver<T extends any = any>
	extends Logger {

	readonly origin: string;
	private readonly regex: RegExp;

	constructor(origin = '.*') {
		super();
		this.setTag(`Receiver (${origin})`);
		this.origin = origin;
		this.regex = new RegExp(origin);
	}

	mount() {
		ModuleFE_WindowMessenger.addReceiver(this);
		return this;
	}

	unmount() {
		ModuleFE_WindowMessenger.removeReceiver(this);
		return this;
	}

	readonly execute = (origin: string, message: T) => {
		if (!this.regex.test(origin))
			return;

		this.executeImpl(message);
	};

	abstract executeImpl(message: T): void
}

export class RawReceiver
	extends BaseReceiver {
	readonly execute: (message: any) => void;

	constructor(execute: (message: any) => void, origin = '.*') {
		super(origin);
		this.execute = execute;
	}

	executeImpl(message: any): void {
		this.execute(message);
	}
}

/**
 * Need to add a processor per each key prop's value that can be returned in the transformer output.
 */
export class Receiver<T extends Message>
	extends BaseReceiver {

	private readonly messageProcessorMap: TypedMap<(message: any) => void> = {};
	private readonly transform: (data: any) => T[]; // Receives one window message, returns array with 1 or more transformed messages
	private defaultProcessor?: (message: any) => void;

	constructor(origin = '.*', transform: (data: any) => T[] = data => [data] as T[]) {
		super();
		this.setTag(`Receiver (${origin})`);
		this.transform = transform;
	}

	setDefaultProcessor(processor: (message: any) => void) {
		this.defaultProcessor = processor;
		return this;
	}

	addProcessor<K extends T>(key: K['key'], processor: (message: K) => void) {
		this.messageProcessorMap[key] = processor;
		return this;
	}

	executeImpl(message: any) {
		const typedMessages = this.transform(message);
		typedMessages.forEach(_message => {
			const processor = this.messageProcessorMap[_message.key];
			if (processor) {
				processor(_message);
				return;
			}

			this.logDebug(`No message processor defined for key ${message.key}`);
			this.defaultProcessor?.(_message);
			return;
		});

	}
}