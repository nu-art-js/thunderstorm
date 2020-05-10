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

import {
	currentTimeMillies,
	Minute,
	Module
} from "@nu-art/ts-common";
import {
	WebAPICallResult,
	WebClient
} from '@slack/web-api';

interface ChatPostMessageResult
	extends WebAPICallResult {
	channel: string;
	ts: string;
	message: {
		text: string;
	}
}

type ConfigType = {
	token: string
	defaultChannel: string
	throttlingTime?: number
};

type _SlackMessage = {
	text: string
	channel: string
}

type SlackMessage = string | _SlackMessage

type MessageMap = {
	[text: string]: number
}

export class SlackModule_Class
	extends Module<ConfigType> {
	private web!: WebClient;
	private messageMap: MessageMap = {};

	constructor() {
		super("slack");
	}

	protected init(): void {
		this.web = new WebClient(this.config.token);
	}

	public async postMessage(slackMessage: SlackMessage) {
		const parameters: SlackMessage = typeof slackMessage === 'string' ? {text: slackMessage, channel: this.config.defaultChannel} : slackMessage;

		if (this.messageMap[parameters.text])
			return;

		try {
			return await this.postMessageImpl(parameters);
		} catch (e) {
			this.logError(`Error while sending a message to channel: ${parameters.channel}`, e);
		}
	}

	private async postMessageImpl(message: _SlackMessage) {
		const res = await this.web.chat.postMessage(message) as ChatPostMessageResult;
		this.messageMap[message.text] = currentTimeMillies();
		setTimeout(
			() => delete this.messageMap[message.text],
			this.config.throttlingTime || Minute
		);

		this.logDebug(
			`A message was posted to channel: ${message.channel} with message id ${res.ts} which contains the message ${message.text}`);

	}
}

export const SlackModule = new SlackModule_Class();
