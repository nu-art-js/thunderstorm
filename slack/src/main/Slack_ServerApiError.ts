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
import {
	ErrorMessage,
	Module,
	ServerErrorSeverity,
	ServerErrorSeverity_Ordinal,
	CustomException,
	BadImplementationException,
	ThisShouldNotHappenException
} from '@nu-art/ts-common';
import {ModuleBE_Slack, ThreadPointer} from './ModuleBE_Slack';
import {ChatPostMessageArguments} from '@slack/web-api';
import {ApiException} from '@nu-art/thunderstorm/backend';
import {
	Composer_ApiException,
	Composer_BadImplementationException,
	Composer_NotificationText,
	Composer_ThisShouldNotHappenException
} from './composers-and-builders/exception-message-composer';
import {SlackBuilder_Divider, SlackBuilder_TextSection, SlackBuilder_TextSectionWithTitle} from './composers-and-builders/slack-message-builder';

type Config = {
	exclude: string[]
	minLevel: ServerErrorSeverity
}

export class Slack_ServerApiError_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig({exclude: [], minLevel: ServerErrorSeverity.Info});
	}

	protected init(): void {
	}

	async __processApplicationError(errorLevel: ServerErrorSeverity, module: Module, message: ErrorMessage) {
		if (ServerErrorSeverity_Ordinal.indexOf(errorLevel) < ServerErrorSeverity_Ordinal.indexOf(this.config.minLevel))
			return;

		const threadPointer = await this.sendMessage(message.message);
		if (!threadPointer)
			return;

		for (const innerMessage of (message.innerMessages || [])) {
			await this.sendMessage(innerMessage, threadPointer);
		}
	}

	public composeSlackStructuredMessage = (exception: CustomException, channel?: string): ChatPostMessageArguments => {
		let dataMessage = `No message composer defined for type ${exception.exceptionType}`;

		if (exception.isInstanceOf(ApiException))
			dataMessage = Composer_ApiException(exception as ApiException);
		else if (exception.isInstanceOf(BadImplementationException))
			dataMessage = Composer_BadImplementationException(exception);
		else if (exception.isInstanceOf(ThisShouldNotHappenException))
			dataMessage = Composer_ThisShouldNotHappenException(exception);

		return {
			text: Composer_NotificationText(exception),
			channel: channel!,
			blocks: SlackBuilder_TextSectionWithTitle(':octagonal_sign:  *API Error*', dataMessage)
		};
	};

	async __processExceptionError(errorLevel: ServerErrorSeverity, exception: CustomException) {
		if (ServerErrorSeverity_Ordinal.indexOf(errorLevel) < ServerErrorSeverity_Ordinal.indexOf(this.config.minLevel))
			return;

		const message = this.composeSlackStructuredMessage(exception);
		const thread = await ModuleBE_Slack.postStructuredMessage(message);
		if (!thread)
			return;

		//Send a full stack reply in thread
		const stackSection: ChatPostMessageArguments = {
			blocks: [
				SlackBuilder_TextSection(''),
				SlackBuilder_Divider(),
				SlackBuilder_TextSection(`\`\`\`${exception.stack}\`\`\``),
			]
		} as ChatPostMessageArguments;
		if (stackSection)
			await ModuleBE_Slack.postStructuredMessage(stackSection, thread);
	}

	private sendMessage(message: string, threadPointer?: ThreadPointer) {
		for (const key of this.config.exclude || []) {
			if (message.includes(key))
				return;
		}

		return ModuleBE_Slack.postMessage(message, undefined, threadPointer);
	}
}

export const Slack_ServerApiError = new Slack_ServerApiError_Class();
