import {__stringify, Logger, Module, TypedMap} from '@thunder-storm/common';
import {Message} from '../ModuleFE_WindowMessenger';


class ModuleFE_BroadcastChannel_Class
	extends Module {

	//######################### Static #########################

	private channels: TypedMap<BroadcastChannel> = {};

	//######################### Life Cycle #########################

	private register = (receiver: TS_BroadcastChannel<any>) => {
		if (this.channels[receiver.channelTopic])
			return this.logWarning(`already registered channel: ${receiver.channelTopic}`);

		this.logInfo(`registered channel: ${receiver.channelTopic}`);
		const channel = new BroadcastChannel(receiver.channelTopic);
		this.channels[receiver.channelTopic] = channel;
		channel.onmessage = (message) => {
			this.logDebug('message', message);
			receiver.execute(message.data);
		};
	};

	private unregister = (receiver: TS_BroadcastChannel<any>) => {
		if (!this.channels[receiver.channelTopic])
			return;

		const channel = this.channels[receiver.channelTopic];
		delete this.channels[receiver.channelTopic];
		channel.close();
	};

	private sendMessage = <T extends Message>(channel: TS_BroadcastChannel<T>, message: T) => {
		this.logDebug(`sending message: ${__stringify(message)}`);
		this.channels[channel.channelTopic].postMessage(message);
	};
}

export const ModuleFE_BroadcastChannel = new ModuleFE_BroadcastChannel_Class();

export class TS_BroadcastChannel<T extends Message>
	extends Logger {
	readonly channelTopic: string;
	private readonly messageProcessorMap: TypedMap<(message: any) => void> = {};

	constructor(channelTopic: string) {
		super(`BroadcastChannel-${channelTopic}`);
		this.channelTopic = channelTopic;
	}

	sendMessage = (message: T) => {
		// @ts-ignore
		const sendMessage = ModuleFE_BroadcastChannel.sendMessage;
		sendMessage(this, message);
	};

	mount = () => {
		// @ts-ignore
		const register = ModuleFE_BroadcastChannel.register;
		register(this);
		return this;
	};

	unmount = () => {
		// @ts-ignore
		const unregister = ModuleFE_BroadcastChannel.unregister;
		unregister(this);
	};

	addProcessor = <K extends T>(key: K['key'], processor: (message: K) => void) => {
		this.messageProcessorMap[key] = processor;
		return this;
	};

	execute = (message: T) => {
		const processor = this.messageProcessorMap[message.key];
		if (!processor) {
			this.logError('No message processor defined for key ${message.key}');
			return;
		}

		this.logDebug(`received message: ${__stringify(message)}`);
		processor(message);
	};
}
