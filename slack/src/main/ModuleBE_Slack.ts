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

import {currentTimeMillis, ImplementationMissingException, Minute, Module} from '@nu-art/ts-common';
import {WebClient, WebClientOptions, WebAPICallResult, ChatPostMessageArguments} from '@slack/web-api';


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

	public async postMessage(slackMessage: SlackMessage, messageId?: ThreadPointer) {
		const message: SlackMessage = typeof slackMessage === 'string' ? {text: slackMessage, channel: this.config.defaultChannel} : slackMessage;
		message.channel ??= this.config.defaultChannel;

		const time = this.messageMap[message.text];
		if (time && currentTimeMillis() - time < (this.config.throttlingTime || Minute))
			return;

		// try {
		return await this.postMessageImpl(message, messageId);
		// } catch (e: any) {
		// 	this.logError(`Error while sending a message to channel: ${message.channel}\n`, e);
		// }
	}

	private async postMessageImpl(message: _SlackMessage, threadPointer?: ThreadPointer): Promise<ThreadPointer> {
		let res: ChatPostMessageResult;
		if (threadPointer) {
			const reply = {...message, thread_ts: threadPointer.ts};
			this.logDebug('sending slack reply: ', reply);
			res = await this.web.chat.postMessage(reply as ChatPostMessageArguments) as ChatPostMessageResult;
		} else {
			this.logDebug('sending slack message: ', message);
			res = await this.web.chat.postMessage(message as ChatPostMessageArguments) as ChatPostMessageResult;
		}
		this.messageMap[message.text] = currentTimeMillis();

		this.logDebug(`A message was posted to channel: ${message.channel} with message id ${res.ts} which contains the message ${message.text}`);

		return {ts: res.ts, channel: res.channel};
	}

	public async postStructuredMessage(message: any) {

	}
}

export const ModuleBE_Slack = new ModuleBE_Slack_Class();
