import {Logger, Module, removeItemFromArray, TypedMap} from '@nu-art/ts-common';

interface Messagable {
	postMessage(message: any, targetOrigin: string, transfer?: Transferable[]): void;

	postMessage(message: any, options?: WindowPostMessageOptions): void;
}

type Message = {
	key: string
}

class ModuleFE_WindowMessenger_Class
	extends Module {

	//######################### Static #########################

	readonly receivers: Receiver<any>[] = [];
	private listener?: (e: MessageEvent) => void;

	//######################### Life Cycle #########################

	addReceiver(receiver: Receiver<any>) {
		if (this.receivers.includes(receiver))
			return;

		this.receivers.push(receiver);
		if (this.receivers.length > 0 && !this.listener)
			window.addEventListener('message', this.listener = (e: MessageEvent) => {
				const {data, origin} = e;
				this.receivers.forEach(receiver => receiver.execute(origin, data));
			});
	}

	removeReceiver(receiver: Receiver<any>) {
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

	createReceiver<T extends Message>(origin?: string) {
		return new Receiver(origin);
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

export class Receiver<T extends Message>
	extends Logger {

	private readonly origin: string;
	private readonly regex: RegExp;
	private readonly messageProcessorMap: TypedMap<(message: any) => void> = {};

	constructor(origin = '.*') {
		super();
		this.setTag(`Receiver (${origin})`);
		this.origin = origin;
		this.regex = new RegExp(this.origin);
	}

	mount() {
		ModuleFE_WindowMessenger.addReceiver(this);
		return this;
	}

	unmount() {
		ModuleFE_WindowMessenger.removeReceiver(this);
	}

	addProcessor<K extends T>(key: K['key'], processor: (message: K) => void) {
		this.messageProcessorMap[key] = processor;
		return this;
	}

	execute(origin: string, message: T) {
		if (!this.regex.test(origin))
			return;

		const processor = this.messageProcessorMap[message.key];
		if (!processor) {
			this.logDebug('No message processor defined for key ${message.key}');
			return;
		}

		processor(message);
	}
}