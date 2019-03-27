/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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

import {Module} from "@nu-art/core";
import {Fronzy, HttpMethod, HttpModule} from "@nu-art/fronzy";

type Config = {
	remoteUrl: string
}

export interface OnLabelReceived {
	onLabelReceived: () => void
}

class _ExampleModule
	extends Module<Config> {
	private message!: string;

	constructor() {
		super();
	}

	public getMessageFromServer() {
		this.logInfo("getting label from server");

		(async () => {
			const httpRequest = await HttpModule.createRequest(HttpMethod.GET).setRelativeUrl("/api/v1/sample/endpoint-example").execute()
			this.message = httpRequest.xhr.status != 200 ? `got error: ${httpRequest.xhr.status}` : httpRequest.xhr.response;

			Fronzy.dispatchUIEvent((item: any) => item.onLabelReceived, (l: OnLabelReceived) => {
				l.onLabelReceived();
			});
		})();

		this.logInfo("continue... will receive label on callback..");
	}

	getMessage() {
		return this.message;
	}
}

export const ExampleModule = new _ExampleModule();