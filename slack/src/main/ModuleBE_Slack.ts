/*
 * Storm contains a list of utility functions.. this project
 * might be broken down into more smaller projects in the future.
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

/**
 * Created by AlanBen on 29/08/2019.
 */

import {currentTimeMillis, generateHex, ImplementationMissingException, md5, Minute, Module, PartialProperties} from '@nu-art/ts-common';
import {ChatPostMessageArguments, FilesUploadArguments, WebAPICallResult, WebClient, WebClientOptions} from '@slack/web-api';


interface ChatPostMessageResult
	extends WebAPICallResult {
	channel: string;
	ts: string;
	message: {
		text: string;
	};
}

export type ConfigType_ModuleBE_Slack = {
	token: string
	defaultChannel: string
	throttlingTime?: number
	slackConfig?: Partial<WebClientOptions>
};

export type PreSendSlackStructuredMessage = PartialProperties<ChatPostMessageArguments, 'channel' | 'text'>

type _SlackMessage = {
	text: string
	channel?: string
	messageId?: string
}

export type SlackMessage = string | _SlackMessage

type MessageMap = {
	[text: string]: number
}

export type ThreadPointer = { ts: string, channel: string };

export class ModuleBE_Slack_Class
	extends Module<ConfigType_ModuleBE_Slack, any> {
	private web!: WebClient;
	private messageMap: MessageMap = {};

	constructor() {
		super('slack');
	}

	protected init(): void {
		if (!this.config.token)
			throw new ImplementationMissingException('Missing config token for ModuleBE_Slack. Please add it');

		this.web = new WebClient(
			this.config.token,
			{
				rejectRateLimitedCalls: true,
				...this.config.slackConfig
			});
	}

	public async postMessage(text: string, channel?: string, thread?: ThreadPointer) {
		const message: PreSendSlackStructuredMessage = {
			text,
			channel: channel ?? this.config.defaultChannel,
		};

		//Block same message on throttling time
		const time = this.messageMap[md5(text)];
		if (time && currentTimeMillis() - time < (this.config.throttlingTime || Minute))
			return;

		//Post and return thread
		return await this.postMessageImpl(message as ChatPostMessageArguments, thread);
	}

	public async postFile(file: any, name: string, thread?: ThreadPointer) {
		const message: FilesUploadArguments = {
			file,
			filename: name,
			channels: this.config.defaultChannel
		};
		if (thread) {
			message.channels = thread.channel;
			message.thread_ts = thread.ts;
		}
		await this.web.files.upload(message);
	}

	public async postStructuredMessage(message: PreSendSlackStructuredMessage, thread?: ThreadPointer) {
		message.channel ??= this.config.defaultChannel;
		message.text ??= generateHex(8);

		const time = this.messageMap[message.text as string];
		if (time && currentTimeMillis() - time < (this.config.throttlingTime || Minute))
			return;

		return await this.postMessageImpl(message as ChatPostMessageArguments, thread);
	}

	private async postMessageImpl(message: ChatPostMessageArguments, threadPointer?: ThreadPointer): Promise<ThreadPointer> {
		if (threadPointer) {
			message.thread_ts = threadPointer.ts;
			message.channel = threadPointer.channel;
		}
		this.logDebug(`Sending message in ${threadPointer ? 'thread' : 'channel'}`, message);
		const res = await this.web.chat.postMessage(message) as ChatPostMessageResult;

		//Add message to map
		this.messageMap[md5(message.text)] = currentTimeMillis();

		this.logDebug(`A message was posted to channel: ${message.channel} with message id ${res.ts} which contains the message ${message.text}`);
		return {ts: res.ts, channel: res.channel};
	}

	public async getUserIdByEmail(email: string): Promise<string | undefined> {
		const result: WebAPICallResult = await this.web.users.lookupByEmail({email});
		if (result.ok)
			// @ts-ignore
			return result.user.id;

		return undefined;
	}

	public async openDM(userIds: string[]): Promise<string | undefined> {
		const users = userIds.join(',');
		const result = await this.web.conversations.open({users});
		if (result.ok) { // @ts-ignore
			return result.channel.id;
		}
	}
}

export const ModuleBE_Slack = new ModuleBE_Slack_Class();
