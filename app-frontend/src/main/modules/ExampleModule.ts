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

import {
	HttpMethod,
	Module
} from "@nu-art/ts-common";

import {
	HttpModule,
	Thunder,
	UIDispatcher
} from "@nu-art/thunder";
import {
	CommonBodyReq,
	ExampleApiGetType,
	ExampleApiPostType
} from "@shared/shared";

type Config = {
	remoteUrl: string
}

export interface OnLabelReceived {
	onLabelReceived: () => void
}

export class ExampleModule_Class
	extends Module<Config> {
	private message!: string;
	private dispatcher_onLabelReceived: UIDispatcher<OnLabelReceived>;


	constructor() {
		super();
		this.dispatcher_onLabelReceived = Thunder.createUIDispatcher<OnLabelReceived>("onLabelReceived");

	}

	public getMessageFromServer() {
		this.logInfo("getting label from server");

		this.runAsync("/v1/sample/another-endpoint", async () => {
			const bodyObject: CommonBodyReq = {message: this.message};
			const httpRequest = await HttpModule.createRequest<ExampleApiPostType>(HttpMethod.POST).setJsonBody(bodyObject).setRelativeUrl(
				"/v1/sample/another-endpoint").execute();
			this.message = httpRequest.xhr.status !== 200 ? `got error: ${httpRequest.xhr.status}` : httpRequest.xhr.response;
		});

		this.runAsync(this.config.remoteUrl, async () => {
			const httpRequest = await HttpModule.createRequest<ExampleApiGetType>(HttpMethod.GET).setRelativeUrl(this.config.remoteUrl).execute();
			this.message = httpRequest.xhr.status !== 200 ? `got error: ${httpRequest.xhr.status}` : httpRequest.xhr.response;
			this.dispatcher_onLabelReceived.dispatch();
		});

		this.logInfo("continue... will receive label on callback..");
	}

	getMessage() {
		return this.message;
	}
}

export const ExampleModule = new ExampleModule_Class();