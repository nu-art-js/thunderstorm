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
import {Module} from "@nu-art/ts-common";
import {
	OnApplicationError,
	ServerErrorSeverity,
	ServerErrorSeverity_Ordinal
} from "@nu-art/ts-common";
import {SlackModule} from "../SlackModule";

type Config = {
	exclude: string[]
	minLevel: ServerErrorSeverity
}

export class Slack_ServerApiError_Class
	extends Module<Config>
	implements OnApplicationError {
	constructor() {
		super();
		this.setDefaultConfig({exclude: [], minLevel: ServerErrorSeverity.Debug})
	}

	protected init(): void {
	}

	async __processApplicationError(errorLevel: ServerErrorSeverity, module: Module, message: string) {
		if (ServerErrorSeverity_Ordinal.indexOf(errorLevel) < ServerErrorSeverity_Ordinal.indexOf(this.config.minLevel))
			return;

		for (const key of this.config.exclude || []) {
			if (message.includes(key))
				return
		}

		await SlackModule.postMessage(`\`\`\`${message}\`\`\``);
	}
}

export const Slack_ServerApiError = new Slack_ServerApiError_Class();
