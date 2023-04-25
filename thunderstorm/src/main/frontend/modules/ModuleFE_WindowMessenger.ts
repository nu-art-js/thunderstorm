import {Module, TypedMap} from '@nu-art/ts-common';

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

	readonly messageProcessorMap: TypedMap<(data: any) => void> = {};
	readonly origin = window.origin;

	//######################### Life Cycle #########################

	constructor() {
		super();
		this.logInfo(this.origin);
		window.addEventListener('message', e => {
			const {data, origin} = e;
			if (origin !== this.origin)
				return;

			this.messageProcessorMap[data.key]?.(data);
		});
	}

	addProcessor<T extends Message>(key: T['key'], processor: (data: T) => void) {
		this.messageProcessorMap[key] = processor;
	}

	sendMessage<T extends Message>(message: T, target: Messagable) {
		target.postMessage(message);
	}

	createMessenger<T extends Message>(target: Messagable) {
		return new Messenger<T>(target);
	}
}

export const ModuleFE_WindowMessenger = new ModuleFE_WindowMessenger_Class();

export class Messenger<T extends Message> {
	readonly target: Messagable;

	constructor(target: Messagable) {
		this.target = target;
	}

	sendMessage(message: T) {
		ModuleFE_WindowMessenger.sendMessage(message, this.target);
	}
}